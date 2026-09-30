import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

// Precomputed cost-12 bcrypt hash for constant-time comparison when user does not exist
const DUMMY_HASH = '$2b$12$ozLdNWshL6Rt5upPRsar4.xVOZuXxk69HFHQ2sn7MG3sSb5kPgsiy';

// In-memory rate limiting store: `${ip}:${username}` -> [timestamps]
const failedAttempts = new Map();

/**
 * Checks if 5 failed login attempts have occurred within the last 15 minutes.
 */
export function isRateLimited(ip, username) {
  const key = `${ip || 'unknown'}:${(username || '').trim().toLowerCase()}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const timestamps = (failedAttempts.get(key) || []).filter((t) => now - t < windowMs);
  failedAttempts.set(key, timestamps);
  return timestamps.length >= 5;
}

/**
 * Records a failed login attempt.
 */
export function recordFailedAttempt(ip, username) {
  const key = `${ip || 'unknown'}:${(username || '').trim().toLowerCase()}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const timestamps = (failedAttempts.get(key) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  failedAttempts.set(key, timestamps);
}

/**
 * Clears failed attempts upon successful login.
 */
export function clearFailedAttempts(ip, username) {
  const key = `${ip || 'unknown'}:${(username || '').trim().toLowerCase()}`;
  failedAttempts.delete(key);
}

/**
 * Dummy comparison to ensure constant-time behavior when user does not exist.
 */
export async function dummyCompare(password) {
  await bcrypt.compare(password || '', DUMMY_HASH);
}

/**
 * Authenticates the request via JWT in httpOnly cookie and checks active status from DB.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.crm_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const secret = process.env.JWT_SECRET || 'crm_secret_jwt_key_default';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }

    // Always query DB to ensure user is active (prompt requirement: deactivated users rejected on every request)
    const [rows] = await pool.query(
      'SELECT user_id, username, full_name, role, is_active FROM USERS WHERE user_id = ?',
      [decoded.userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Account is inactive or disabled. Please contact an administrator.' });
    }

    const user = rows[0];
    req.user = {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('requireAuth middleware error:', err);
    res.status(500).json({ error: 'Authentication verification failure' });
  }
}

/**
 * Role authorization guard.
 */
export function requireRole(allowedRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({ error: 'Forbidden: Administrator role required' });
    }

    next();
  };
}
