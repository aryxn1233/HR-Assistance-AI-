const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'Aryxn@123', database: 'hr_platform' });
c.connect().then(async () => {
    // Show recent interviews with their status and question counts
    const r = await c.query(`
        SELECT i.id, i.status, i."currentQuestionIndex",
               COUNT(q.id) as question_count
        FROM interviews i
        LEFT JOIN interview_questions q ON q."interviewId" = i.id
        GROUP BY i.id, i.status, i."currentQuestionIndex"
        ORDER BY i."createdAt" DESC LIMIT 5
    `);
    console.log('Interviews with question counts:');
    r.rows.forEach(row => console.log(JSON.stringify(row)));
    c.end();
}).catch(e => { console.error(e.message); c.end(); });
