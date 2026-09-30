import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/criminals - List criminals with LEFT JOINs to POLICE, COURT_RECORD, JAIL
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      crime = '',
      officer = '',
      jail = '',
      hasCourtRecord = '',
      isJailed = '',
      sortBy = 'criminal_id',
      sortOrder = 'ASC',
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortColumns = {
      criminal_id: 'c.criminal_id',
      name: 'c.name',
      age: 'c.age',
      crime: 'c.crime',
      investigation_status: 'c.investigation_status',
      officer_name: 'p.name',
      court_room_number: 'cr.court_room_number',
      jail_location: 'j.location',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'c.criminal_id';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(c.name LIKE ? OR CAST(c.criminal_id AS CHAR) LIKE ? OR c.crime LIKE ? OR p.name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      conditions.push('c.investigation_status = ?');
      params.push(status);
    }

    if (crime) {
      conditions.push('c.crime = ?');
      params.push(crime);
    }

    if (officer) {
      conditions.push('c.investigating_officer = ?');
      params.push(parseInt(officer, 10));
    }

    if (jail) {
      conditions.push('j.location = ?');
      params.push(jail);
    }

    if (hasCourtRecord === 'true') {
      conditions.push('cr.court_room_number IS NOT NULL');
    } else if (hasCourtRecord === 'false') {
      conditions.push('cr.court_room_number IS NULL');
    }

    if (isJailed === 'true') {
      conditions.push('j.location IS NOT NULL');
    } else if (isJailed === 'false') {
      conditions.push('j.location IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT c.criminal_id) AS total
      FROM CRIMINAL c
      LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
      LEFT JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
      LEFT JOIN JAIL j ON c.criminal_id = j.criminal_id
      ${whereClause}
    `;

    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT c.criminal_id, c.name, c.age, c.crime, c.investigating_officer, c.investigation_status,
             p.name AS officer_name, p.\`rank\` AS officer_rank, p.branch AS officer_branch,
             cr.court_room_number,
             j.location AS jail_location, j.barrack_number, j.sentence
      FROM CRIMINAL c
      LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
      LEFT JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
      LEFT JOIN JAIL j ON c.criminal_id = j.criminal_id
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
    console.error('Error fetching criminals:', err);
    res.status(500).json({ error: 'Failed to fetch criminals' });
  }
});

// GET /api/criminals/:id - Detailed Criminal Profile
router.get('/:id', async (req, res) => {
  try {
    const criminalId = parseInt(req.params.id, 10);
    if (isNaN(criminalId)) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }

    const sql = `
      SELECT c.criminal_id, c.name, c.age, c.crime, c.investigation_status,
             p.police_id, p.\`rank\` AS officer_rank, p.name AS officer_name, p.branch AS officer_branch,
             p.number AS officer_number, p.address AS officer_address,
             cr.court_room_number,
             j.location AS jail_location, j.barrack_number, j.sentence
      FROM CRIMINAL c
      LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
      LEFT JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
      LEFT JOIN JAIL j ON c.criminal_id = j.criminal_id
      WHERE c.criminal_id = ?
    `;

    const [rows] = await pool.query(sql, [criminalId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Criminal record not found' });
    }

    const record = rows[0];

    // Build timeline if applicable
    const timeline = [];
    if (record.criminal_id) {
      timeline.push({
        title: 'Case Registered',
        description: `FIR registered for ${record.crime}. Assigned to ${record.officer_rank} ${record.officer_name} (${record.officer_branch}). Current status: ${record.investigation_status}.`,
        status: record.investigation_status,
      });
    }
    if (record.court_room_number) {
      timeline.push({
        title: 'Court Assignment',
        description: `Scheduled for trial proceedings in Court Room #${record.court_room_number}.`,
        status: 'In Court',
      });
    }
    if (record.jail_location) {
      timeline.push({
        title: 'Sentencing & Incarceration',
        description: `Remanded to ${record.jail_location}, Barrack ${record.barrack_number}. Sentence term: ${record.sentence}.`,
        status: 'Incarcerated',
      });
    }

    const isViewer = req.user?.role === 'viewer';

    res.json({
      criminal: {
        criminal_id: record.criminal_id,
        name: record.name,
        age: record.age,
        crime: record.crime,
        investigation_status: record.investigation_status,
      },
      officer: record.police_id ? {
        police_id: record.police_id,
        rank: record.officer_rank,
        name: record.officer_name,
        branch: record.officer_branch,
        number: isViewer ? null : record.officer_number,
        address: isViewer ? null : record.officer_address,
      } : null,
      courtRecord: record.court_room_number ? {
        court_room_number: record.court_room_number,
      } : null,
      jailRecord: record.jail_location ? {
        location: record.jail_location,
        barrack_number: record.barrack_number,
        sentence: record.sentence,
      } : null,
      timeline: timeline.length > 0 ? timeline : null,
    });
  } catch (err) {
    console.error('Error fetching criminal profile:', err);
    res.status(500).json({ error: 'Failed to fetch criminal profile' });
  }
});

// POST /api/criminals - Add new criminal (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { criminal_id, name, age, crime, investigating_officer, investigation_status } = req.body;

    const cid = parseInt(criminal_id, 10);
    const cAge = parseInt(age, 10);
    const officerId = parseInt(investigating_officer, 10);

    if (isNaN(cid) || cid <= 0) {
      return res.status(400).json({ error: 'Criminal ID must be a positive integer' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (isNaN(cAge) || cAge < 18 || cAge > 100) {
      return res.status(400).json({ error: 'Criminal age must be between 18 and 100' });
    }
    if (!crime || typeof crime !== 'string' || !crime.trim()) {
      return res.status(400).json({ error: 'Crime is required' });
    }
    if (isNaN(officerId)) {
      return res.status(400).json({ error: 'Investigating Officer is required' });
    }
    const validStatuses = ['Open', 'Under Investigation', 'Closed'];
    if (!validStatuses.includes(investigation_status)) {
      return res.status(400).json({ error: 'Status must be Open, Under Investigation, or Closed' });
    }

    // Check if ID already exists
    const [existing] = await pool.query('SELECT criminal_id FROM CRIMINAL WHERE criminal_id = ?', [cid]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `Criminal with ID ${cid} already exists` });
    }

    // Check if officer exists
    const [officer] = await pool.query('SELECT police_id FROM POLICE WHERE police_id = ?', [officerId]);
    if (officer.length === 0) {
      return res.status(400).json({ error: `Selected investigating officer (ID: ${officerId}) does not exist` });
    }

    await pool.query(
      'INSERT INTO CRIMINAL (criminal_id, name, age, crime, investigating_officer, investigation_status) VALUES (?, ?, ?, ?, ?, ?)',
      [cid, name.trim(), cAge, crime.trim(), officerId, investigation_status]
    );

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'CREATE',
      tableName: 'CRIMINAL',
      recordId: String(cid),
      detail: JSON.stringify({ name: name.trim(), crime: crime.trim(), investigating_officer: officerId }),
    });

    res.status(201).json({ message: 'Criminal record created successfully', criminal_id: cid });
  } catch (err) {
    console.error('Error creating criminal:', err);
    res.status(500).json({ error: 'Failed to create criminal record' });
  }
});

// PUT /api/criminals/:id - Edit criminal (Admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const criminalId = parseInt(req.params.id, 10);
    const { name, age, crime, investigating_officer, investigation_status } = req.body;
    const cAge = parseInt(age, 10);
    const officerId = parseInt(investigating_officer, 10);

    if (isNaN(criminalId)) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (isNaN(cAge) || cAge < 18 || cAge > 100) {
      return res.status(400).json({ error: 'Criminal age must be between 18 and 100' });
    }
    if (!crime || !crime.trim()) {
      return res.status(400).json({ error: 'Crime is required' });
    }
    if (isNaN(officerId)) {
      return res.status(400).json({ error: 'Investigating Officer is required' });
    }
    const validStatuses = ['Open', 'Under Investigation', 'Closed'];
    if (!validStatuses.includes(investigation_status)) {
      return res.status(400).json({ error: 'Status must be Open, Under Investigation, or Closed' });
    }

    // Verify officer exists
    const [officer] = await pool.query('SELECT police_id FROM POLICE WHERE police_id = ?', [officerId]);
    if (officer.length === 0) {
      return res.status(400).json({ error: `Selected investigating officer (ID: ${officerId}) does not exist` });
    }

    const [result] = await pool.query(
      'UPDATE CRIMINAL SET name = ?, age = ?, crime = ?, investigating_officer = ?, investigation_status = ? WHERE criminal_id = ?',
      [name.trim(), cAge, crime.trim(), officerId, investigation_status, criminalId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Criminal record not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'UPDATE',
      tableName: 'CRIMINAL',
      recordId: String(criminalId),
      detail: JSON.stringify({ name: name.trim(), crime: crime.trim(), status: investigation_status }),
    });

    res.json({ message: 'Criminal record updated successfully' });
  } catch (err) {
    console.error('Error updating criminal:', err);
    res.status(500).json({ error: 'Failed to update criminal record' });
  }
});

// DELETE /api/criminals/:id - Delete criminal (Admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const criminalId = parseInt(req.params.id, 10);
    if (isNaN(criminalId)) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }

    // Check court and jail references
    const [courtCheck] = await pool.query('SELECT court_room_number FROM COURT_RECORD WHERE criminal_id = ?', [criminalId]);
    const [jailCheck] = await pool.query('SELECT location FROM JAIL WHERE criminal_id = ?', [criminalId]);

    const hasCourt = courtCheck.length > 0;
    const hasJail = jailCheck.length > 0;

    if (hasCourt && hasJail) {
      return res.status(400).json({
        error: `Cannot delete: criminal has an active court assignment (Court #${courtCheck[0].court_room_number}) and a jail sentence at ${jailCheck[0].location}. Remove those records first.`,
      });
    }
    if (hasCourt) {
      return res.status(400).json({
        error: `Cannot delete: criminal is assigned to Court Room #${courtCheck[0].court_room_number}. Remove court record first.`,
      });
    }
    if (hasJail) {
      return res.status(400).json({
        error: `Cannot delete: criminal has a jail record at ${jailCheck[0].location}. Remove jail record first.`,
      });
    }

    const [result] = await pool.query('DELETE FROM CRIMINAL WHERE criminal_id = ?', [criminalId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Criminal record not found' });
    }

    await logAudit({
      userId: req.user.userId,
      username: req.user.username,
      action: 'DELETE',
      tableName: 'CRIMINAL',
      recordId: String(criminalId),
      detail: 'Deleted criminal record',
    });

    res.json({ message: 'Criminal record deleted successfully' });
  } catch (err) {
    if (err.errno === 1451) {
      return res.status(400).json({
        error: 'Cannot delete: criminal is referenced by court or jail records. Remove those records first.',
      });
    }
    console.error('Error deleting criminal:', err);
    res.status(500).json({ error: 'Failed to delete criminal record' });
  }
});

export default router;
