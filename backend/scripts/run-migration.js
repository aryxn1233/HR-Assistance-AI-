/**
 * run-migration.js
 * Connects directly to the Render PostgreSQL DB and runs create-tables.sql
 * Usage: node scripts/run-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');

const client = new Client({
  host: 'dpg-d7pemjnavr4c73enr07g-a.oregon-postgres.render.com',
  port: 5432,
  user: 'hr_assistance_user',
  password: 'yyO9LNJDDNC3uoegzRGn31IzT9ROyK3G',
  database: 'hr_assistance',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function run() {
  console.log('Connecting to Render PostgreSQL...');
  await client.connect();
  console.log('Connected. Running migration...\n');

  try {
    const res = await client.query(sql);
    // query() returns the last result when given a multi-statement string
    const results = Array.isArray(res) ? res : [res];
    results.forEach((r) => {
      if (r.rows && r.rows.length > 0) {
        console.log(r.rows);
      }
    });
    console.log('\n✅  Migration completed successfully!');
  } catch (err) {
    console.error('\n❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
