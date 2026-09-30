import { Router } from 'express';
import { pool } from '../config/db.js';
import { performance } from 'perf_hooks';

const router = Router();

export const QUERIES = [
  {
    id: 1,
    category: 'Joins',
    title: 'Criminals with Investigating Officers',
    description: 'Retrieves all criminals paired with their assigned investigating officer, rank, and police branch using an INNER JOIN.',
    sql: `SELECT c.criminal_id, c.name AS criminal_name, c.crime, c.investigation_status,
       p.police_id, p.name AS officer_name, p.\`rank\` AS officer_rank, p.branch
FROM CRIMINAL c
INNER JOIN POLICE p ON c.investigating_officer = p.police_id
ORDER BY c.criminal_id ASC;`,
  },
  {
    id: 2,
    category: 'Joins',
    title: 'Criminals with Court Room Assignments',
    description: 'Lists every criminal assigned to a specific judicial chamber using an INNER JOIN with the COURT_RECORD table.',
    sql: `SELECT c.criminal_id, c.name AS criminal_name, c.crime,
       cr.court_room_number
FROM CRIMINAL c
INNER JOIN COURT_RECORD cr ON c.criminal_id = cr.criminal_id
ORDER BY cr.court_room_number ASC;`,
  },
  {
    id: 3,
    category: 'Joins',
    title: 'Criminals with Jail Incarceration Details',
    description: 'Fetches detention particulars including facility location, barrack number, and sentencing terms via an INNER JOIN on JAIL.',
    sql: `SELECT c.criminal_id, c.name AS criminal_name, c.crime,
       j.location AS jail_location, j.barrack_number, j.sentence
FROM CRIMINAL c
INNER JOIN JAIL j ON c.criminal_id = j.criminal_id
ORDER BY c.criminal_id ASC;`,
  },
  {
    id: 4,
    category: 'Aggregates',
    title: 'Total Count of Registered Criminals',
    description: 'Calculates the aggregate volume of criminal records stored in the department registry using the COUNT() aggregate function.',
    sql: `SELECT COUNT(*) AS total_criminals
FROM CRIMINAL;`,
  },
  {
    id: 5,
    category: 'Aggregates',
    title: 'Average Age of All Criminals',
    description: 'Computes the arithmetic mean age across all registered convicts using AVG() rounded to 4 decimal places.',
    sql: `SELECT ROUND(AVG(age), 4) AS average_age
FROM CRIMINAL;`,
  },
  {
    id: 6,
    category: 'Aggregates',
    title: 'Criminals per Investigating Officer',
    description: 'Calculates case load distribution across all officers, including officers with 0 active cases, using LEFT JOIN and GROUP BY.',
    sql: `SELECT p.police_id, p.name AS officer_name, p.\`rank\`, p.branch,
       COUNT(c.criminal_id) AS total_cases
FROM POLICE p
LEFT JOIN CRIMINAL c ON p.police_id = c.investigating_officer
GROUP BY p.police_id, p.name, p.\`rank\`, p.branch
ORDER BY total_cases DESC, p.police_id ASC;`,
  },
  {
    id: 7,
    category: 'Aggregates',
    title: 'Inmate Population per Jail Facility',
    description: 'Aggregates prison occupancy across correctional centers using GROUP BY on location.',
    sql: `SELECT location, COUNT(*) AS criminal_count
FROM JAIL
GROUP BY location
ORDER BY criminal_count DESC, location ASC;`,
  },
  {
    id: 8,
    category: 'Subqueries',
    title: 'Criminals Older than Department Average Age',
    description: 'Identifies all perpetrators whose age exceeds the department-wide arithmetic mean age via a scalar subquery.',
    sql: `SELECT criminal_id, name, age, crime, investigation_status
FROM CRIMINAL
WHERE age > (SELECT AVG(age) FROM CRIMINAL)
ORDER BY age DESC;`,
  },
  {
    id: 9,
    category: 'Subqueries',
    title: 'Officers with At Least One Active Investigation',
    description: 'Filters the police roster for personnel who currently have one or more active cases using an IN subquery.',
    sql: `SELECT police_id, name, \`rank\`, branch, age, number
FROM POLICE
WHERE police_id IN (SELECT DISTINCT investigating_officer FROM CRIMINAL)
ORDER BY police_id ASC;`,
  },
  {
    id: 10,
    category: 'Subqueries',
    title: 'Criminals with an Assigned Court Record',
    description: 'Queries individuals who have been formally assigned to judicial courtroom dockets using an IN subquery.',
    sql: `SELECT criminal_id, name, age, crime, investigation_status
FROM CRIMINAL
WHERE criminal_id IN (SELECT criminal_id FROM COURT_RECORD)
ORDER BY criminal_id ASC;`,
  },
];

// GET /api/queries - Returns metadata for all 10 predefined queries
router.get('/', (req, res) => {
  res.json(QUERIES);
});

// POST /api/queries/:id/run - Executes a predefined query and returns rows, columns, and execution timing
router.post('/:id/run', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const queryObj = QUERIES.find((q) => q.id === id);

    if (!queryObj) {
      return res.status(404).json({ error: `Query with ID ${id} not found` });
    }

    const startTime = performance.now();
    const [rows, fields] = await pool.query(queryObj.sql);
    const endTime = performance.now();

    const executionTimeMs = parseFloat((endTime - startTime).toFixed(3));
    const columns = fields ? fields.map((f) => f.name) : (rows.length > 0 ? Object.keys(rows[0]) : []);

    res.json({
      id: queryObj.id,
      title: queryObj.title,
      sql: queryObj.sql,
      description: queryObj.description,
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs,
    });
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Failed to execute query: ' + err.message });
  }
});

export default router;
