const axios = require('axios');
require('dotenv').config({ path: './.env' });

async function checkApiResponse() {
    try {
        // We need a JWT token to call /interviews
        // Let's try to register a new recruiter or use existing credentials
        // For simplicity, I'll try to find a way to get a token or bypass if possible
        // Actually, I'll just use the DB directly to see what TypeORM returns.

        console.log('Testing what InterviewsService.findAll() returns...');
        // But I can't easily call the service from outside NestJS.
        // Instead, I'll use the earlier script to log the raw JSON of one interview.

        const { Client } = require('pg');
        const client = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await client.connect();
        const res = await client.query('SELECT transcript FROM interviews WHERE status = \'completed\' LIMIT 1');
        if (res.rows.length > 0) {
            console.log('Raw transcript data from DB:');
            console.log(JSON.stringify(res.rows[0].transcript, null, 2));
        } else {
            console.log('No completed interviews found.');
        }
        await client.end();
    } catch (err) {
        console.error(err);
    }
}

checkApiResponse();
