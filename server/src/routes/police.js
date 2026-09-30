import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/police - List police officers with filtering, sorting, pagination, and case counts
router.get('/', async (req, res) => {
  try {
    const { search = '', rank = '', branch = '', sortBy = 'police_id', sortOrder = 'ASC', page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Allowed sort columns to prevent SQL injection in ORDER BY
    const allowedSortColumns = {
      police_id: 'p.police_id',
      rank: 'p.`rank`',
      name: 'p.name',
      branch: 'p.branch',
      age: 'p.age',
      number: 'p.number',
      address: 'p.address',
      case_count: 'case_count',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'p.police_id';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR CAST(p.police_id AS CHAR) LIKE ? OR p.branch LIKE ? OR p.`rank` LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (rank) {
      conditions.push('p.`rank` = ?');
      params.push(rank);
    }

    if (branch) {
      conditions.push('p.branch = ?');
      params.push(branch);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query for total count
    const countSql = `
      SELECT COUNT(DISTINCT p.police_id) AS total
      FROM POLICE p
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Main data query with LEFT JOIN to count assigned criminals
    const dataSql = `
      SELECT p.police_id, p.\`rank\`, p.name, p.branch, p.age, p.number, p.address,
             COUNT(c.criminal_id) AS case_count
      FROM POLICE p
      LEFT JOIN CRIMINAL c ON p.police_id = c.investigating_officer
      ${whereClause}
      GROUP BY p.police_id, p.\`rank\`, p.name, p.branch, p.age, p.number, p.address
      ORDER BY ${sortColumn} ${direction}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

    // Field-level restriction on the server: strip phone and address for viewers
    if (req.user?.role === 'viewer') {
      rows.forEach((r) => {
        r.number = null;
        r.address = null;
      });
    }

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
    console.error('Error fetching police officers:', err);
    res.status(500).json({ error: 'Failed to fetch police officers' });
  }
});

// GET /api/police/:id - Officer detail view with investigated criminals and workload breakdown
router.get('/:id', async (req, res) => {
  try {
    const policeId = parseInt(req.params.id, 10);
    if (isNaN(policeId)) {
      return res.status(400).json({ error: 'Valid Police ID is required' });
    }

    const [officerRows] = await pool.query(
      'SELECT police_id, `rank`, name, branch, age, number, address FROM POLICE WHERE police_id = ?',
      [policeId]
    );

    if (officerRows.length === 0) {
      return res.status(404).json({ error: 'Police officer not found' });
    }

    const officer = officerRows[0];

    // Field-level restriction on the server: strip phone and address for viewers
    if (req.user?.role === 'viewer') {
      officer.number = null;
      officer.address = null;
    }

    // List of criminals investigated by this officer
    const [criminalRows] = await pool.query(
      `SELECT c.criminal_id, c.name, c.age, c.crime, c.investigation_status,
              cr.court_room_number, j.location AS jail_location, j.barrack_number, j.sentence
       FROM CRIMINAL c
       LEFT JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
       LEFT JOIN JAIL j ON c.criminal_id = j.criminal_id
       WHERE c.investigating_officer = ?
       ORDER BY c.criminal_id ASC`,
      [policeId]
    );

    // Workload statistics
    const workload = {
      total: criminalRows.length,
      open: criminalRows.filter((c) => c.investigation_status === 'Open').length,
      underInvestigation: criminalRows.filter((c) => c.investigation_status === 'Under Investigation').length,
      closed: criminalRows.filter((c) => c.investigation_status === 'Closed').length,
    };

    res.json({
      ...officer,
      workload,
      criminals: criminalRows,
    });
  } catch (err) {
    console.error('Error fetching officer details:', err);
    res.status(500).json({ error: 'Failed to fetch police officer details' });
  }
});

// POST /api/police - Add new police officer (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { police_id, rank, name, branch, age, number, address } = req.body;

    const pid = parseInt(police_id, 10);
    const pAge = parseInt(age, 10);

    if (isNaN(pid) || pid <= 0) {
      return res.status(400).json({ error: 'Police ID must be a positive integer' });
    }
    if (!rank || typeof rank !== 'string' || !rank.trim()) {
      return res.status(400).json({ error: 'Rank is required' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return res.status(400).json({ error: 'Branch is required' });
    }
    if (isNaN(pAge) || pAge < 21 || pAge > 65) {
      return res.status(400).json({ error: 'Officer age must be between 21 and 65' });
    }
    if (!number || typeof number !== 'string' || !number.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Check if ID exists
    const [existing] = await pool.query('SELECT police_id FROM POLICE WHERE police_id = ?', [pid]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `Police officer with ID ${pid} already exists` });
    }

    await pool.query(
      'INSERT INTO POLICE (police_id, `rank`, name, branch, age, number, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pid, rank.trim(), name.trim(), branch.trim(), pAge, number.trim(), address.trim()]
    );

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'CREATE',
      tableName: 'POLICE',
      recordId: String(pid),
      detail: JSON.stringify({ rank: rank.trim(), name: name.trim(), branch: branch.trim() }),
    });

    res.status(201).json({ message: 'Police officer created successfully', police_id: pid });
  } catch (err) {
    console.error('Error creating police officer:', err);
    res.status(500).json({ error: 'Failed to create police officer' });
  }
});

// PUT /api/police/:id - Edit police officer (Admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const policeId = parseInt(req.params.id, 10);
    const { rank, name, branch, age, number, address } = req.body;
    const pAge = parseInt(age, 10);

    if (isNaN(policeId)) {
      return res.status(400).json({ error: 'Valid Police ID is required' });
    }
    if (!rank || !rank.trim()) {
      return res.status(400).json({ error: 'Rank is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!branch || !branch.trim()) {
      return res.status(400).json({ error: 'Branch is required' });
    }
    if (isNaN(pAge) || pAge < 21 || pAge > 65) {
      return res.status(400).json({ error: 'Officer age must be between 21 and 65' });
    }
    if (!number || !number.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const [result] = await pool.query(
      'UPDATE POLICE SET `rank` = ?, name = ?, branch = ?, age = ?, number = ?, address = ? WHERE police_id = ?',
      [rank.trim(), name.trim(), branch.trim(), pAge, number.trim(), address.trim(), policeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Police officer not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'UPDATE',
      tableName: 'POLICE',
      recordId: String(policeId),
      detail: JSON.stringify({ rank: rank.trim(), name: name.trim(), branch: branch.trim() }),
    });

    res.json({ message: 'Police officer updated successfully' });
  } catch (err) {
    console.error('Error updating police officer:', err);
    res.status(500).json({ error: 'Failed to update police officer' });
  }
});

// DELETE /api/police/:id - Delete officer with human-readable FK error message (Admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const policeId = parseInt(req.params.id, 10);
    if (isNaN(policeId)) {
      return res.status(400).json({ error: 'Valid Police ID is required' });
    }

    // Check foreign key constraint before deleting
    const [assigned] = await pool.query(
      'SELECT COUNT(*) AS count FROM CRIMINAL WHERE investigating_officer = ?',
      [policeId]
    );
    const count = assigned[0]?.count || 0;

    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete: officer is assigned to ${count} criminal${count === 1 ? '' : 's'}. Reassign them before deleting this officer.`,
      });
    }

    const [result] = await pool.query('DELETE FROM POLICE WHERE police_id = ?', [policeId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Police officer not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'DELETE',
      tableName: 'POLICE',
      recordId: String(policeId),
      detail: 'Deleted police officer record',
    });

    res.json({ message: 'Police officer deleted successfully' });
  } catch (err) {
    if (err.errno === 1451) {
      return res.status(400).json({
        error: 'Cannot delete: officer is assigned to one or more criminal records. Reassign them first.',
      });
    }
    console.error('Error deleting police officer:', err);
    res.status(500).json({ error: 'Failed to delete police officer' });
  }
});

export default router;
