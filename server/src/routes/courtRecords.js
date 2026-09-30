import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/court-records - List court records with criminal and officer details
router.get('/', async (req, res) => {
  try {
    const { search = '', sortBy = 'court_room_number', sortOrder = 'ASC', page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortColumns = {
      court_room_number: 'cr.court_room_number',
      criminal_id: 'cr.criminal_id',
      criminal_name: 'c.name',
      crime: 'c.crime',
      investigation_status: 'c.investigation_status',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'cr.court_room_number';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(CAST(cr.court_room_number AS CHAR) LIKE ? OR CAST(cr.criminal_id AS CHAR) LIKE ? OR c.name LIKE ? OR c.crime LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM COURT_RECORD cr
      JOIN CRIMINAL c ON cr.criminal_id = c.criminal_id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT cr.court_room_number, cr.criminal_id,
             c.name AS criminal_name, c.age AS criminal_age, c.crime, c.investigation_status,
             p.name AS officer_name, p.\`rank\` AS officer_rank
      FROM COURT_RECORD cr
      JOIN CRIMINAL c ON cr.criminal_id = c.criminal_id
      LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}
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
    console.error('Error fetching court records:', err);
    res.status(500).json({ error: 'Failed to fetch court records' });
  }
});

// GET /api/court-records/unassigned-criminals - Criminals not currently assigned to any court room
router.get('/unassigned-criminals', async (req, res) => {
  try {
    const { includeCriminalId } = req.query;
    let sql = `
      SELECT c.criminal_id, c.name, c.crime, c.age, c.investigation_status
      FROM CRIMINAL c
      WHERE c.criminal_id NOT IN (SELECT criminal_id FROM COURT_RECORD)
    `;
    const params = [];

    if (includeCriminalId) {
      sql += ' OR c.criminal_id = ?';
      params.push(parseInt(includeCriminalId, 10));
    }

    sql += ' ORDER BY c.criminal_id ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching unassigned criminals for court:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned criminals' });
  }
});

// POST /api/court-records - Assign criminal to court room (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { court_room_number, criminal_id } = req.body;

    const roomNum = parseInt(court_room_number, 10);
    const cid = parseInt(criminal_id, 10);

    if (isNaN(roomNum) || roomNum <= 0) {
      return res.status(400).json({ error: 'Court Room Number must be a positive integer' });
    }
    if (isNaN(cid) || cid <= 0) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }

    // Check if court room already assigned
    const [existingRoom] = await pool.query(
      'SELECT court_room_number, criminal_id FROM COURT_RECORD WHERE court_room_number = ?',
      [roomNum]
    );
    if (existingRoom.length > 0) {
      return res.status(409).json({ error: `Court Room #${roomNum} is already assigned to Criminal #${existingRoom[0].criminal_id}` });
    }

    // Check if criminal exists
    const [criminal] = await pool.query('SELECT criminal_id, name FROM CRIMINAL WHERE criminal_id = ?', [cid]);
    if (criminal.length === 0) {
      return res.status(400).json({ error: `Criminal with ID ${cid} does not exist` });
    }

    // Check if criminal is already assigned to a court room
    const [existingAssignment] = await pool.query(
      'SELECT court_room_number FROM COURT_RECORD WHERE criminal_id = ?',
      [cid]
    );
    if (existingAssignment.length > 0) {
      return res.status(409).json({
        error: `Criminal #${cid} is already assigned to Court Room #${existingAssignment[0].court_room_number}`,
      });
    }

    await pool.query('INSERT INTO COURT_RECORD (court_room_number, criminal_id) VALUES (?, ?)', [roomNum, cid]);

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'CREATE',
      tableName: 'COURT_RECORD',
      recordId: String(roomNum),
      detail: JSON.stringify({ court_room_number: roomNum, criminal_id: cid }),
    });

    res.status(201).json({ message: 'Court record created successfully', court_room_number: roomNum });
  } catch (err) {
    console.error('Error creating court record:', err);
    res.status(500).json({ error: 'Failed to create court record' });
  }
});

// PUT /api/court-records/:court_room_number - Reassign criminal to court room (Admin only)
router.put('/:court_room_number', requireRole('admin'), async (req, res) => {
  try {
    const roomNum = parseInt(req.params.court_room_number, 10);
    const { criminal_id } = req.body;
    const cid = parseInt(criminal_id, 10);

    if (isNaN(roomNum) || isNaN(cid)) {
      return res.status(400).json({ error: 'Valid Court Room Number and Criminal ID are required' });
    }

    const [criminal] = await pool.query('SELECT criminal_id FROM CRIMINAL WHERE criminal_id = ?', [cid]);
    if (criminal.length === 0) {
      return res.status(400).json({ error: `Criminal with ID ${cid} does not exist` });
    }

    const [existing] = await pool.query(
      'SELECT court_room_number FROM COURT_RECORD WHERE criminal_id = ? AND court_room_number != ?',
      [cid, roomNum]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: `Criminal #${cid} is already assigned to Court Room #${existing[0].court_room_number}`,
      });
    }

    const [result] = await pool.query(
      'UPDATE COURT_RECORD SET criminal_id = ? WHERE court_room_number = ?',
      [cid, roomNum]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Court record not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'UPDATE',
      tableName: 'COURT_RECORD',
      recordId: String(roomNum),
      detail: JSON.stringify({ court_room_number: roomNum, new_criminal_id: cid }),
    });

    res.json({ message: 'Court record updated successfully' });
  } catch (err) {
    console.error('Error updating court record:', err);
    res.status(500).json({ error: 'Failed to update court record' });
  }
});

// DELETE /api/court-records/:court_room_number - Remove court record (Admin only)
router.delete('/:court_room_number', requireRole('admin'), async (req, res) => {
  try {
    const roomNum = parseInt(req.params.court_room_number, 10);
    if (isNaN(roomNum)) {
      return res.status(400).json({ error: 'Valid Court Room Number is required' });
    }

    const [result] = await pool.query('DELETE FROM COURT_RECORD WHERE court_room_number = ?', [roomNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Court record not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'DELETE',
      tableName: 'COURT_RECORD',
      recordId: String(roomNum),
      detail: 'Deleted court record',
    });

    res.json({ message: 'Court record removed successfully' });
  } catch (err) {
    console.error('Error deleting court record:', err);
    res.status(500).json({ error: 'Failed to delete court record' });
  }
});

export default router;
