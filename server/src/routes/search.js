import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// GET /api/search?q=... - Global search with grouped results
router.get('/', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const query = q.trim();

    if (!query) {
      return res.json({ criminals: [], police: [], courtRecords: [], jails: [] });
    }

    const term = `%${query}%`;

    // 1. Search Criminals
    const [criminals] = await pool.query(
      `SELECT c.criminal_id, c.name, c.crime, c.investigation_status, p.name AS officer_name
       FROM CRIMINAL c
       LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
       WHERE c.name LIKE ? OR CAST(c.criminal_id AS CHAR) LIKE ? OR c.crime LIKE ?
       LIMIT 8`,
      [term, term, term]
    );

    // 2. Search Police Officers
    const [police] = await pool.query(
      `SELECT p.police_id, p.\`rank\`, p.name, p.branch, p.number
       FROM POLICE p
       WHERE p.name LIKE ? OR CAST(p.police_id AS CHAR) LIKE ? OR p.branch LIKE ?
       LIMIT 8`,
      [term, term, term]
    );

    // 3. Search Court Records
    const [courtRecords] = await pool.query(
      `SELECT cr.court_room_number, cr.criminal_id, c.name AS criminal_name, c.crime
       FROM COURT_RECORD cr
       JOIN CRIMINAL c ON cr.criminal_id = c.criminal_id
       WHERE CAST(cr.court_room_number AS CHAR) LIKE ? OR c.name LIKE ?
       LIMIT 8`,
      [term, term]
    );

    // 4. Search Jail Records
    const [jails] = await pool.query(
      `SELECT j.location, j.criminal_id, j.barrack_number, j.sentence, c.name AS criminal_name
       FROM JAIL j
       JOIN CRIMINAL c ON j.criminal_id = c.criminal_id
       WHERE j.location LIKE ? OR j.barrack_number LIKE ? OR c.name LIKE ?
       LIMIT 8`,
      [term, term, term]
    );

    res.json({
      criminals,
      police,
      courtRecords,
      jails,
    });
  } catch (err) {
    console.error('Error in global search:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
