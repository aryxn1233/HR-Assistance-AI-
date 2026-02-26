const { DataSource } = require('typeorm');
require('dotenv').config();

async function debugReports() {
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

        console.log('\n--- Latest Interviews ---');
        const interviews = await dataSource.query(`
      SELECT i.id, i."applicationId", i.status, i.score, i.completed, i."createdAt"
      FROM interviews i
      ORDER BY i."createdAt" DESC
      LIMIT 5
    `);
        console.table(interviews);

        if (interviews.length > 0) {
            const interviewId = interviews[0].id;
            console.log(`\n--- Reports for Interview ${interviewId} ---`);
            const reports = await dataSource.query(`
        SELECT r.id, r."interviewId", r."overallScore", r.recommendation, r."createdAt"
        FROM interview_reports r
        WHERE r."interviewId" = $1
      `, [interviewId]);
            console.table(reports);

            console.log(`\n--- Application Status for ID ${interviews[0].applicationId} ---`);
            const apps = await dataSource.query(`
        SELECT a.id, a.status, a."interviewScore", a."interviewStatus"
        FROM applications a
        WHERE a.id = $1
      `, [interviews[0].applicationId]);
            console.table(apps);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await dataSource.destroy();
    }
}

debugReports();
