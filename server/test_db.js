import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
console.log('Trying port', process.env.DB_PORT);
async function run() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'students',
      database: process.env.DB_NAME || 'crm_db',
    });
    const connection = await pool.getConnection();
    console.log('Success!');
    connection.release();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
run();
