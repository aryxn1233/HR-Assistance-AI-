const { Client } = require('pg');
const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Aryxn@123',
    database: 'hr_platform'
});
c.connect()
    .then(() => c.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'candidate_experiences'"))
    .then(r => {
        console.log('Table candidate_experiences exists:', r.rows.length > 0);
        return c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'candidate_experiences'");
    })
    .then(r => {
        console.log('Columns:', r.rows.map(row => row.column_name));
        c.end();
    })
    .catch(e => {
        console.error('DB error:', e.message);
        c.end();
    });
