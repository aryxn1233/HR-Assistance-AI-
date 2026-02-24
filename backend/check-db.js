const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkJobs() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, title, \"createdBy\" FROM jobs');
        console.log('--- JOBS ---');
        res.rows.forEach(r => console.log(`${r.id} | ${r.title} | ${r.createdBy}`));

        const usersRes = await client.query('SELECT id, email, role FROM users');
        console.log('\n--- USERS ---');
        usersRes.rows.forEach(r => console.log(`${r.id} | ${r.email} | ${r.role}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkJobs();
