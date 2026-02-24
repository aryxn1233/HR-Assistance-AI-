const { Client } = require('pg');

async function checkStatus() {
    const client = new Client({
        connectionString: "postgresql://postgres:Aryxn@123@localhost:5432/hr_platform"
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, status, "interviewScore" FROM applications');
        console.log('Applications Statuses:', JSON.stringify(res.rows, null, 2));

        const interviews = await client.query('SELECT id, status, score, transcript FROM interviews LIMIT 10');
        console.log('Interviews Statuses:', JSON.stringify(interviews.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkStatus();
