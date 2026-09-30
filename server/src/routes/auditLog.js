import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All audit log routes require admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// GET /api/audit-log - Paginated audit logs with filtering and CSV export
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      user = '',
      action = '',
      table = '',
      startDate = '',
      endDate = '',
      export: exportFormat = '',
    } = req.query;

    const conditions = [];
    const params = [];

    if (user.trim()) {
      conditions.push('(username LIKE ? OR CAST(user_id AS CHAR) = ?)');
      params.push(`%${user.trim()}%`, user.trim());
    }

    if (action.trim()) {
      conditions.push('action = ?');
      params.push(action.trim());
    }

    if (table.trim()) {
      conditions.push('table_name = ?');
      params.push(table.trim());
    }

    if (startDate.trim()) {
      conditions.push('created_at >= ?');
      params.push(`${startDate.trim()} 00:00:00`);
    }

    if (endDate.trim()) {
      conditions.push('created_at <= ?');
      params.push(`${endDate.trim()} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // If CSV export is requested, retrieve all matching rows up to 5,000 records
    if (exportFormat.toLowerCase() === 'csv') {
      const csvSql = `
        SELECT log_id, created_at, username, action, table_name, record_id, detail
        FROM AUDIT_LOG
        ${whereClause}
        ORDER BY log_id DESC
        LIMIT 5000
      `;

      const [rows] = await pool.query(csvSql, params);

      // Helper to escape CSV values
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = ['Log ID', 'Timestamp', 'Username', 'Action', 'Table', 'Record ID', 'Detail'];
      const csvLines = [headers.join(',')];

      for (const row of rows) {
        csvLines.push([
          escapeCsv(row.log_id),
          escapeCsv(row.created_at ? new Date(row.created_at).toISOString() : ''),
          escapeCsv(row.username),
          escapeCsv(row.action),
          escapeCsv(row.table_name || 'N/A'),
          escapeCsv(row.record_id || 'N/A'),
          escapeCsv(row.detail || ''),
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="crms_audit_log.csv"');
      return res.status(200).send(csvLines.join('\n'));
    }

    // Standard paginated JSON response
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const countSql = `SELECT COUNT(*) AS total FROM AUDIT_LOG ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT log_id, user_id, username, action, table_name, record_id, detail, created_at
      FROM AUDIT_LOG
      ${whereClause}
      ORDER BY log_id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error('Audit log retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit log entries' });
  }
});

export default router;
