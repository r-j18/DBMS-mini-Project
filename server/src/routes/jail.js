import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// GET /api/jail - List jail records with criminal & officer info
router.get('/', async (req, res) => {
  try {
    const { search = '', location = '', sortBy = 'location', sortOrder = 'ASC', page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const allowedSortColumns = {
      location: 'j.location',
      criminal_id: 'j.criminal_id',
      barrack_number: 'j.barrack_number',
      sentence: 'j.sentence',
      criminal_name: 'c.name',
      crime: 'c.crime',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'j.location';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(j.location LIKE ? OR j.barrack_number LIKE ? OR CAST(j.criminal_id AS CHAR) LIKE ? OR c.name LIKE ? OR c.crime LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (location) {
      conditions.push('j.location = ?');
      params.push(location);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM JAIL j
      JOIN CRIMINAL c ON j.criminal_id = c.criminal_id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT j.location, j.criminal_id, j.barrack_number, j.sentence,
             c.name AS criminal_name, c.age AS criminal_age, c.crime, c.investigation_status,
             p.name AS officer_name, p.\`rank\` AS officer_rank
      FROM JAIL j
      JOIN CRIMINAL c ON j.criminal_id = c.criminal_id
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
    console.error('Error fetching jail records:', err);
    res.status(500).json({ error: 'Failed to fetch jail records' });
  }
});

// GET /api/jail/locations - Group-by-location view with counts and criminal lists
router.get('/locations', async (req, res) => {
  try {
    const [locationCounts] = await pool.query(`
      SELECT location, COUNT(*) AS inmate_count
      FROM JAIL
      GROUP BY location
      ORDER BY inmate_count DESC, location ASC
    `);

    const [allInmates] = await pool.query(`
      SELECT j.location, j.criminal_id, j.barrack_number, j.sentence,
             c.name AS criminal_name, c.crime
      FROM JAIL j
      JOIN CRIMINAL c ON j.criminal_id = c.criminal_id
      ORDER BY j.location ASC, j.barrack_number ASC
    `);

    // Group inmates under their respective location
    const grouped = locationCounts.map((loc) => ({
      location: loc.location,
      inmate_count: loc.inmate_count,
      inmates: allInmates.filter((inmate) => inmate.location === loc.location),
    }));

    res.json(grouped);
  } catch (err) {
    console.error('Error fetching jail locations:', err);
    res.status(500).json({ error: 'Failed to fetch jail location statistics' });
  }
});

// GET /api/jail/unassigned-criminals - Criminals who are not currently jailed
router.get('/unassigned-criminals', async (req, res) => {
  try {
    const { includeCriminalId } = req.query;
    let sql = `
      SELECT c.criminal_id, c.name, c.crime, c.age, c.investigation_status
      FROM CRIMINAL c
      WHERE c.criminal_id NOT IN (SELECT criminal_id FROM JAIL)
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
    console.error('Error fetching unassigned criminals for jail:', err);
    res.status(500).json({ error: 'Failed to fetch unassigned criminals' });
  }
});

// POST /api/jail - Assign criminal to jail
router.post('/', async (req, res) => {
  try {
    const { location, criminal_id, barrack_number, sentence } = req.body;
    const cid = parseInt(criminal_id, 10);

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Jail location is required' });
    }
    if (isNaN(cid) || cid <= 0) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }
    if (!barrack_number || typeof barrack_number !== 'string' || !barrack_number.trim()) {
      return res.status(400).json({ error: 'Barrack number is required' });
    }
    if (!sentence || typeof sentence !== 'string' || !sentence.trim()) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    // Check if criminal exists
    const [criminal] = await pool.query('SELECT criminal_id FROM CRIMINAL WHERE criminal_id = ?', [cid]);
    if (criminal.length === 0) {
      return res.status(400).json({ error: `Criminal with ID ${cid} does not exist` });
    }

    // Check if criminal already has a jail record
    const [existingJail] = await pool.query('SELECT location, barrack_number FROM JAIL WHERE criminal_id = ?', [cid]);
    if (existingJail.length > 0) {
      return res.status(409).json({
        error: `Criminal #${cid} is already serving a sentence at ${existingJail[0].location} (Barrack ${existingJail[0].barrack_number})`,
      });
    }

    await pool.query(
      'INSERT INTO JAIL (location, criminal_id, barrack_number, sentence) VALUES (?, ?, ?, ?)',
      [location.trim(), cid, barrack_number.trim(), sentence.trim()]
    );

    res.status(201).json({ message: 'Jail record created successfully', criminal_id: cid });
  } catch (err) {
    console.error('Error creating jail record:', err);
    res.status(500).json({ error: 'Failed to create jail record' });
  }
});

// PUT /api/jail/:criminal_id - Edit jail record
router.put('/:criminal_id', async (req, res) => {
  try {
    const cid = parseInt(req.params.criminal_id, 10);
    const { location, barrack_number, sentence } = req.body;

    if (isNaN(cid)) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Jail location is required' });
    }
    if (!barrack_number || !barrack_number.trim()) {
      return res.status(400).json({ error: 'Barrack number is required' });
    }
    if (!sentence || !sentence.trim()) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    const [result] = await pool.query(
      'UPDATE JAIL SET location = ?, barrack_number = ?, sentence = ? WHERE criminal_id = ?',
      [location.trim(), barrack_number.trim(), sentence.trim(), cid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Jail record not found' });
    }

    res.json({ message: 'Jail record updated successfully' });
  } catch (err) {
    console.error('Error updating jail record:', err);
    res.status(500).json({ error: 'Failed to update jail record' });
  }
});

// DELETE /api/jail/:criminal_id - Remove jail record
router.delete('/:criminal_id', async (req, res) => {
  try {
    const cid = parseInt(req.params.criminal_id, 10);
    if (isNaN(cid)) {
      return res.status(400).json({ error: 'Valid Criminal ID is required' });
    }

    const [result] = await pool.query('DELETE FROM JAIL WHERE criminal_id = ?', [cid]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Jail record not found' });
    }

    res.json({ message: 'Jail record removed successfully' });
  } catch (err) {
    console.error('Error deleting jail record:', err);
    res.status(500).json({ error: 'Failed to delete jail record' });
  }
});

export default router;
