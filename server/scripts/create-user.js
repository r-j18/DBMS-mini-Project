#!/usr/bin/env node
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const [,, username, password, role, fullNameArg] = process.argv;

if (!username || !password || !role) {
  console.error('Usage: node create-user.js <username> <password> <role: admin|viewer> [full_name]');
  process.exit(1);
}

if (!['admin', 'viewer'].includes(role)) {
  console.error('Error: Role must be either "admin" or "viewer"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters');
  process.exit(1);
}

const fullName = fullNameArg || (role === 'admin' ? 'Chief Inspector Admin' : 'Investigative Officer Viewer');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'students',
    database: process.env.DB_NAME || 'crm_db',
  });

  try {
    console.log(`Hashing password with bcrypt cost 12...`);
    const passwordHash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO USERS (username, full_name, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, true)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        is_active = true
    `;

    const [result] = await connection.execute(query, [username, fullName, passwordHash, role]);
    console.log(`User "${username}" (${role}) successfully saved to USERS table. (ID: ${result.insertId || 'updated'})`);
  } catch (err) {
    console.error('Failed to create/update user:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
