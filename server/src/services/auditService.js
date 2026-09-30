import { pool } from '../config/db.js';

/**
 * Log action to AUDIT_LOG table.
 * Never logs passwords or sensitive credential fields.
 */
export async function logAudit({
  userId = null,
  username = null,
  action,
  tableName = null,
  recordId = null,
  detail = null,
}) {
  try {
    let sanitizedDetail = detail;
    if (typeof sanitizedDetail === 'object' && sanitizedDetail !== null) {
      // Remove any password fields if accidentally present
      const copy = { ...sanitizedDetail };
      delete copy.password;
      delete copy.password_hash;
      delete copy.currentPassword;
      delete copy.newPassword;
      sanitizedDetail = JSON.stringify(copy);
    } else if (typeof sanitizedDetail === 'string') {
      // Basic safeguard
      sanitizedDetail = sanitizedDetail.replace(/"password":\s*"[^"]*"/gi, '"password":"[REDACTED]"');
    }

    const sql = `
      INSERT INTO AUDIT_LOG (user_id, username, action, table_name, record_id, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      userId,
      username || 'ANONYMOUS',
      action,
      tableName,
      recordId ? String(recordId) : null,
      sanitizedDetail,
    ]);
  } catch (err) {
    console.error('Audit log failed to record:', err.message);
    // Non-fatal so we don't crash main operational pipeline
  }
}
