import { Router } from 'express';
import { pool, readonlyPool } from '../config/db.js';
import { performance } from 'perf_hooks';

const router = Router();

// POST /api/sql - Execute ad-hoc read-only SELECT query with security validations
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    let sanitized = query.trim();

    // 1. Block comments
    if (sanitized.includes('--') || sanitized.includes('/*') || sanitized.includes('*/') || sanitized.includes('#')) {
      return res.status(400).json({
        error: 'Security rejection: SQL comments (-- , /* */, #) are not allowed in the read-only console.',
      });
    }

    // 2. Strip single trailing semicolon if present
    if (sanitized.endsWith(';')) {
      sanitized = sanitized.slice(0, -1).trim();
    }

    // 3. Block multiple statements (semicolon check)
    if (sanitized.includes(';')) {
      return res.status(400).json({
        error: 'Security rejection: Multiple statements are not permitted. Execute only a single statement.',
      });
    }

    // 4. Must begin with SELECT
    if (!/^SELECT\b/i.test(sanitized)) {
      return res.status(400).json({
        error: 'Security rejection: Only SELECT queries are permitted in this console.',
      });
    }

    // 5. Block modifying/dangerous keywords
    const blockedKeywords = [
      /\bINSERT\b/i,
      /\bUPDATE\b/i,
      /\bDELETE\b/i,
      /\bDROP\b/i,
      /\bALTER\b/i,
      /\bCREATE\b/i,
      /\bTRUNCATE\b/i,
      /\bRENAME\b/i,
      /\bREPLACE\b/i,
      /\bEXEC\b/i,
      /\bEXECUTE\b/i,
      /\bCALL\b/i,
      /\bGRANT\b/i,
      /\bREVOKE\b/i,
      /\bSET\b/i,
      /\bLOCK\b/i,
      /\bUNLOCK\b/i,
      /\bSHUTDOWN\b/i,
      /\bINTO\s+OUTFILE\b/i,
      /\bINTO\s+DUMPFILE\b/i,
    ];

    for (const pattern of blockedKeywords) {
      if (pattern.test(sanitized)) {
        return res.status(400).json({
          error: `Security rejection: Prohibited keyword detected (${pattern.source}). The console strictly permits single read-only SELECT queries.`,
        });
      }
    }

    // 6. Execute query using read-only pool or read-only transaction
    const startTime = performance.now();
    let rows;
    let fields;

    try {
      // Try read-only pool first
      const result = await readonlyPool.query(sanitized);
      rows = result[0];
      fields = result[1];
    } catch (readonlyErr) {
      // Fallback: Use primary pool inside a strict READ ONLY transaction
      const connection = await pool.getConnection();
      try {
        await connection.query('START TRANSACTION READ ONLY');
        const result = await connection.query(sanitized);
        rows = result[0];
        fields = result[1];
        await connection.query('COMMIT');
      } finally {
        connection.release();
      }
    }

    const endTime = performance.now();
    const executionTimeMs = parseFloat((endTime - startTime).toFixed(3));

    // Cap at 500 rows
    const capped = rows.length > 500;
    const finalRows = capped ? rows.slice(0, 500) : rows;

    const columns = fields ? fields.map((f) => f.name) : (finalRows.length > 0 ? Object.keys(finalRows[0]) : []);

    res.json({
      columns,
      rows: finalRows,
      rowCount: finalRows.length,
      totalReturned: rows.length,
      capped,
      executionTimeMs,
      sql: sanitized,
    });
  } catch (err) {
    console.error('SQL Console Error:', err);
    res.status(400).json({
      error: 'SQL Execution Error: ' + (err.sqlMessage || err.message),
    });
  }
});

export default router;
