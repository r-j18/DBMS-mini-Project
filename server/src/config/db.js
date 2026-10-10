import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Primary Pool for standard application operations
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'students',
  database: process.env.DB_NAME || 'crm_db',
  ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud')) ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  waitForConnections: true,

  connectionLimit: 10,
  queueLimit: 0,
});

// Read-only Pool for SQL Console queries
export const readonlyPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_READONLY_USER || 'crm_readonly',
  password: process.env.DB_READONLY_PASSWORD || 'crm_readonly_pass',
  database: process.env.DB_NAME || 'crm_db',
  ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud')) ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  waitForConnections: true,

  connectionLimit: 5,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database:', process.env.DB_NAME || 'crm_db');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to MySQL database:', err.message);
  }
}
