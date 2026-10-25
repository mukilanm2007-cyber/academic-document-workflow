const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function initializeDatabase() {
  console.log(`[DB INIT] Connecting to MySQL at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('[DB INIT] Connected to MySQL Server successfully.');

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('[DB INIT] Executing schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('[DB INIT] Schema created/verified successfully.');
    } else {
      console.warn('[DB INIT] schema.sql not found at', schemaPath);
    }

    // Check if users table already has data
    await connection.query('USE `academic_document_workflow`;');
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0 && fs.existsSync(seedPath)) {
      console.log('[DB INIT] Seeding initial data from seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('[DB INIT] Seed data inserted successfully.');
    } else {
      console.log(`[DB INIT] Database already contains ${rows[0].count} users. Skipping seed.`);
    }

    console.log('[DB INIT] Database initialization complete.');
    return true;
  } catch (error) {
    console.error('[DB INIT ERROR]', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase, dbConfig };
