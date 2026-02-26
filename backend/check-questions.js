const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkQuestions() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'hr_platform',
        entities: [],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('Database connected');

        const result = await dataSource.query(`
      SELECT a.id, a."candidateId", a."jobId", a."resumeScore", a."interviewQuestions", a.status
      FROM applications a
      ORDER BY a."createdAt" DESC
      LIMIT 1
    `);

        if (result.length > 0) {
            const app = result[0];
            console.log('--- Latest Application ---');
            console.log('ID:', app.id);
            console.log('Status:', app.status);
            console.log('Resume Score:', app.resumeScore);
            console.log('Questions Generated:', Array.isArray(app.interviewQuestions) ? app.interviewQuestions.length : 0);
            if (Array.isArray(app.interviewQuestions) && app.interviewQuestions.length > 0) {
                console.log('Questions:');
                app.interviewQuestions.forEach((q, i) => console.log(`${i + 1}. ${q}`));
            } else {
                console.log('No questions found in interviewQuestions column.');
            }
        } else {
            console.log('No applications found.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await dataSource.destroy();
    }
}

checkQuestions();
