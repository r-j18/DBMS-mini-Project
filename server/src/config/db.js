import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const isTiDB =
  (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud')) ||
  process.env.DB_SSL === 'true';
const defaultPort = isTiDB ? 4000 : 3306;
const sslConfig = isTiDB
  ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  : undefined;

// Primary Pool for standard application operations
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || defaultPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'students',
  database: process.env.DB_NAME || 'crm_db',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,
});

// Read-only Pool for SQL Console queries
export const readonlyPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || defaultPort,
  user: process.env.DB_READONLY_USER || 'crm_readonly',
  password: process.env.DB_READONLY_PASSWORD !== undefined ? process.env.DB_READONLY_PASSWORD : 'crm_readonly_pass',
  database: process.env.DB_NAME || 'crm_db',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,
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
