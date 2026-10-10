import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. Load preview environment file
const previewEnvPath = path.join(projectRoot, '.env.preview');

if (!fs.existsSync(previewEnvPath)) {
  console.error('❌ Error: .env.preview not found at', previewEnvPath);
  console.error('Please create a local .env.preview file with your TiDB preview credentials.');
  process.exit(1);
}

dotenv.config({ path: previewEnvPath });

const {
  DB_HOST,
  DB_PORT = 4000,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error('❌ Error: Incomplete database configuration in .env.preview.');
  console.error('Required: DB_HOST, DB_USER, DB_NAME');
  process.exit(1);
}

// 2. Safety check: Never run against production
const isLikelyProduction =
  DB_NAME.toLowerCase() === 'crm_db' ||
  DB_NAME.toLowerCase().includes('prod') ||
  DB_NAME.toLowerCase().includes('production');

if (isLikelyProduction) {
  console.error(`🚨 SAFETY HALT: Target database "${DB_NAME}" appears to be a production database!`);
  console.error('Preview migration scripts must only run against preview-scoped databases (e.g. criminal_records_preview).');
  process.exit(1);
}

console.log('🔍 Target Preview Database:', DB_NAME);
console.log('🌐 Host:', DB_HOST);

// 3. Connect to Preview TiDB / MySQL
async function applyPreviewMigrations() {
  const isTiDB = DB_HOST.includes('tidbcloud') || DB_SSL === 'true';
  const sslConfig = isTiDB ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      ssl: sslConfig,
      multipleStatements: true,
    });
    console.log('✅ Connected successfully to preview database.');

    // Migration files in strict execution order
    const migrationFiles = [
      'db/schema.sql',
      'db/seed.sql',
      'db/migrations/001_users_audit_log.sql',
      'db/migrations/002_criminal_photo.sql',
    ];

    for (const relFile of migrationFiles) {
      const fullPath = path.join(projectRoot, relFile);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Warning: Migration file ${relFile} does not exist, skipping.`);
        continue;
      }

      console.log(`⏳ Applying ${relFile}...`);
      let sql = fs.readFileSync(fullPath, 'utf8');

      // Strip database creation/drop/switch commands to prevent altering other databases
      sql = sql
        .replace(/DROP\s+DATABASE\s+[^;]+;/gi, '')
        .replace(/CREATE\s+DATABASE\s+[^;]+;/gi, '')
        .replace(/USE\s+[^;]+;/gi, '');

      // Execute SQL statements
      const trimmed = sql.trim();
      if (trimmed) {
        await connection.query(trimmed);
        console.log(`✅ Applied ${relFile}`);
      }
    }

    console.log('🎉 All preview database migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyPreviewMigrations();
