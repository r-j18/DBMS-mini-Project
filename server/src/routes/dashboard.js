import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// GET /api/dashboard - Aggregates for dashboard cards, charts, and recent records
router.get('/', async (req, res) => {
  try {
    // 1. Total criminals
    const [totalCrimRows] = await pool.query('SELECT COUNT(*) AS total_criminals FROM CRIMINAL');
    const totalCriminals = totalCrimRows[0]?.total_criminals || 0;

    // 2. Total officers
    const [totalOffRows] = await pool.query('SELECT COUNT(*) AS total_officers FROM POLICE');
    const totalOfficers = totalOffRows[0]?.total_officers || 0;

    // 3. Cases by status
    const [statusRows] = await pool.query(`
      SELECT investigation_status, COUNT(*) AS count
      FROM CRIMINAL
      GROUP BY investigation_status
      ORDER BY count DESC
    `);
    const statusMap = {
      Open: 0,
      'Under Investigation': 0,
      Closed: 0,
    };
    statusRows.forEach((row) => {
      statusMap[row.investigation_status] = row.count;
    });

    // 4. Criminals in jail
    const [jailCountRows] = await pool.query('SELECT COUNT(*) AS count FROM JAIL');
    const criminalsInJail = jailCountRows[0]?.count || 0;

    // 5. Criminals with court records
    const [courtCountRows] = await pool.query('SELECT COUNT(*) AS count FROM COURT_RECORD');
    const criminalsWithCourt = courtCountRows[0]?.count || 0;

    // 6. Average criminal age
    const [avgAgeRows] = await pool.query('SELECT ROUND(AVG(age), 4) AS avg_age FROM CRIMINAL');
    const averageAge = avgAgeRows[0]?.avg_age ? parseFloat(avgAgeRows[0].avg_age) : 0;

    // 7. Criminals per jail location (for bar chart)
    const [jailLocationRows] = await pool.query(`
      SELECT location, COUNT(*) AS count
      FROM JAIL
      GROUP BY location
      ORDER BY count DESC, location ASC
    `);

    // 8. Criminals per officer (including officers with 0 cases - LEFT JOIN + GROUP BY)
    const [officerWorkloadRows] = await pool.query(`
      SELECT p.police_id, p.name, p.\`rank\`, p.branch, COUNT(c.criminal_id) AS case_count
      FROM POLICE p
      LEFT JOIN CRIMINAL c ON p.police_id = c.investigating_officer
      GROUP BY p.police_id, p.name, p.\`rank\`, p.branch
      ORDER BY case_count DESC, p.police_id ASC
    `);

    // 9. Recent records (Real queries fetching most recently added criminals with details)
    const [recentRecords] = await pool.query(`
      SELECT c.criminal_id, c.name, c.crime, c.age, c.investigation_status,
             p.name AS officer_name, p.\`rank\` AS officer_rank,
             cr.court_room_number,
             j.location AS jail_location
      FROM CRIMINAL c
      LEFT JOIN POLICE p ON c.investigating_officer = p.police_id
      LEFT JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
      LEFT JOIN JAIL j ON c.criminal_id = j.criminal_id
      ORDER BY c.criminal_id DESC
      LIMIT 6
    `);

    res.json({
      stats: {
        totalCriminals,
        totalOfficers,
        casesByStatus: statusMap,
        criminalsInJail,
        criminalsWithCourt,
        averageAge,
      },
      criminalsPerJail: jailLocationRows,
      criminalsPerOfficer: officerWorkloadRows,
      recentRecords,
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
