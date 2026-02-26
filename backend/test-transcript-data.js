const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function checkTranscripts() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const res = await client.query(`
            SELECT 
                i.id, 
                i.status, 
                i.score,
                i.transcript,
                u."firstName", 
                u."lastName"
            FROM interviews i
            JOIN candidates c ON i."candidateId" = c.id
            JOIN users u ON c."userId" = u.id
            ORDER BY i."createdAt" DESC
            LIMIT 5;
        `);

        console.log('Recent Interviews Transcripts:');
        res.rows.forEach(row => {
            console.log('-----------------------------------');
            console.log(`ID: ${row.id}`);
            console.log(`Candidate: ${row.firstName} ${row.lastName}`);
            console.log(`Status: ${row.status}`);
            console.log(`Transcript Length: ${row.transcript ? row.transcript.length : 0}`);
            if (row.transcript) {
                row.transcript.forEach((t, i) => {
                    console.log(`  ${i + 1}. [${t.speaker}] ${t.message.substring(0, 100)}${t.message.length > 100 ? '...' : ''}`);
                });
            } else {
                console.log('  NO TRANSCRIPT');
            }
        });

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await client.end();
    }
}

checkTranscripts();
