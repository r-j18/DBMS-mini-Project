import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// All user management routes require admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, full_name, role, is_active, created_at, last_login
       FROM USERS
       ORDER BY user_id ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', async (req, res) => {
  try {
    const { username = '', full_name = '', password = '', role = 'viewer' } = req.body;
    const cleanUser = username.trim();
    const cleanName = full_name.trim();

    if (!cleanUser) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!cleanName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "viewer"' });
    }

    // Check if username already exists
    const [existing] = await pool.query('SELECT user_id FROM USERS WHERE username = ?', [cleanUser]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `Username "${cleanUser}" is already taken` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO USERS (username, full_name, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [cleanUser, cleanName, passwordHash, role]
    );

    const newUserId = result.insertId;

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'CREATE',
      tableName: 'USERS',
      recordId: String(newUserId),
      detail: JSON.stringify({ username: cleanUser, full_name: cleanName, role }),
    });

    res.status(201).json({
      success: true,
      user: {
        user_id: newUserId,
        username: cleanUser,
        full_name: cleanName,
        role,
        is_active: true,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// PUT /api/users/:id - Edit name/role, activate/deactivate, reset password
router.put('/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const [targetRows] = await pool.query(
      'SELECT user_id, username, full_name, role, is_active FROM USERS WHERE user_id = ?',
      [targetId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const targetUser = targetRows[0];
    const isSelf = targetUser.user_id === req.user.userId;

    // Safety rule check: Count total active admins
    const [adminCountRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM USERS WHERE role = 'admin' AND is_active = TRUE"
    );
    const activeAdminCount = adminCountRows[0].count;
    const isTargetActiveAdmin = targetUser.role === 'admin' && Boolean(targetUser.is_active);

    const { full_name, role, is_active, password } = req.body;

    // 1. Safety check: Self deactivation / demotion
    if (is_active !== undefined && !is_active && isSelf) {
      return res.status(400).json({ error: 'Administrators cannot deactivate their own account.' });
    }
    if (role !== undefined && role !== 'admin' && isSelf) {
      return res.status(400).json({ error: 'Administrators cannot demote their own account.' });
    }

    // 2. Safety check: Last active admin protection
    if (isTargetActiveAdmin && activeAdminCount <= 1) {
      if (is_active !== undefined && !is_active) {
        return res.status(400).json({ error: 'Cannot deactivate the last active administrator.' });
      }
      if (role !== undefined && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot demote the last active administrator.' });
      }
    }

    const updates = [];
    const params = [];
    const changeLog = {};

    if (full_name !== undefined && full_name.trim()) {
      updates.push('full_name = ?');
      params.push(full_name.trim());
      changeLog.full_name = full_name.trim();
    }

    if (role !== undefined && ['admin', 'viewer'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
      changeLog.role = role;
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(Boolean(is_active));
      changeLog.is_active = Boolean(is_active);
    }

    if (password !== undefined && password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      const newHash = await bcrypt.hash(password, 12);
      updates.push('password_hash = ?');
      params.push(newHash);
      changeLog.passwordReset = true;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid update parameters provided' });
    }

    params.push(targetId);
    await pool.query(`UPDATE USERS SET ${updates.join(', ')} WHERE user_id = ?`, params);

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'UPDATE',
      tableName: 'USERS',
      recordId: String(targetId),
      detail: JSON.stringify({ targetUsername: targetUser.username, changes: changeLog }),
    });

    res.json({
      success: true,
      message: `User ${targetUser.username} successfully updated`,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user account' });
  }
});

export default router;
