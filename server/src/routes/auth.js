import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { logAudit } from '../services/auditService.js';
import {
  isRateLimited,
  recordFailedAttempt,
  clearFailedAttempts,
  dummyCompare,
  requireAuth,
} from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login - Authenticate with rate limiting & constant-time check
router.post('/login', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body;
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const cleanUser = username.trim();

    // 1. Rate limiting check (5 failed attempts per 15 min per IP + username)
    if (isRateLimited(ip, cleanUser)) {
      await logAudit({
        action: 'LOGIN_FAILED',
        username: cleanUser || 'UNKNOWN',
        detail: `Rate limit triggered (429) from IP ${ip}`,
      });
      return res.status(429).json({
        error: 'Too many failed login attempts. Please try again in 15 minutes.',
      });
    }

    if (!cleanUser || !password) {
      recordFailedAttempt(ip, cleanUser);
      await dummyCompare(password);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 2. Query user from database
    const [rows] = await pool.query(
      'SELECT user_id, username, full_name, password_hash, role, is_active FROM USERS WHERE username = ?',
      [cleanUser]
    );

    // If user does not exist, run dummy compare for timing attack resistance
    if (rows.length === 0) {
      recordFailedAttempt(ip, cleanUser);
      await dummyCompare(password);
      await logAudit({
        action: 'LOGIN_FAILED',
        username: cleanUser,
        detail: `Failed login for non-existent username from IP ${ip}`,
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Deactivated users are rejected at login
    if (!user.is_active) {
      recordFailedAttempt(ip, cleanUser);
      await dummyCompare(password);
      await logAudit({
        userId: user.user_id,
        username: cleanUser,
        action: 'LOGIN_FAILED',
        detail: `Login attempt for deactivated user from IP ${ip}`,
      });
      return res.status(401).json({
        error: 'Account is inactive or disabled. Please contact an administrator.',
      });
    }

    // 3. Verify password hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      recordFailedAttempt(ip, cleanUser);
      await logAudit({
        userId: user.user_id,
        username: cleanUser,
        action: 'LOGIN_FAILED',
        detail: `Incorrect password from IP ${ip}`,
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 4. Success: clear failed attempts and issue JWT in httpOnly cookie
    clearFailedAttempts(ip, cleanUser);

    await pool.query('UPDATE USERS SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

    await logAudit({
      userId: user.user_id,
      username: user.username,
      action: 'LOGIN',
      detail: `User logged in from IP ${ip}`,
    });

    const secret = process.env.JWT_SECRET || 'crm_secret_jwt_key_default';
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn: '8h' }
    );

    res.cookie('crm_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login processing failure' });
  }
});

// POST /api/auth/logout - Clear session cookie and audit log
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.crm_token;
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded) {
          await logAudit({
            userId: decoded.userId,
            username: decoded.username,
            action: 'LOGOUT',
            detail: 'User logged out',
          });
        }
      } catch (e) {
        // ignore decode error on logout
      }
    }

    res.clearCookie('crm_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me - Retrieve current session user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/change-password - Change current user's password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const [rows] = await pool.query('SELECT password_hash FROM USERS WHERE user_id = ?', [req.user.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User record not found' });
    }

    const currentHash = rows[0].password_hash;
    const match = await bcrypt.compare(currentPassword, currentHash);
    if (!match) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE USERS SET password_hash = ? WHERE user_id = ?', [newHash, req.user.userId]);

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'UPDATE',
      tableName: 'USERS',
      recordId: String(req.user.userId),
      detail: 'User changed their own password',
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
