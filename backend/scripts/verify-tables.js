const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d7pemjnavr4c73enr07g-a.oregon-postgres.render.com',
  port: 5432,
  user: 'hr_assistance_user',
  password: 'yyO9LNJDDNC3uoegzRGn31IzT9ROyK3G',
  database: 'hr_assistance',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tables in hr_assistance database:');
  res.rows.forEach(r => console.log(' ✅', r.table_name));
  await client.end();
}
run();
