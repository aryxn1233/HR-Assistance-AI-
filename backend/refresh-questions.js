
const { DataSource } = require('typeorm');
require('dotenv').config();

// Simple mock for Logger and Config
class MockLogger {
    warn(msg) { console.warn(msg); }
    log(msg) { console.log(msg); }
}

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "ai_interview",
    synchronize: false,
    entities: ["c:/Users/aryxn/Desktop/AI Interview/backend/dist/**/*.entity.js"],
});

async function refreshQuestions() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        const applicationRepo = AppDataSource.getRepository("Application");
        const latestApp = await applicationRepo.findOne({
            order: { createdAt: 'DESC' }
        });

        if (!latestApp) {
            console.error("No application found.");
            process.exit(1);
        }

        console.log(`Refreshing questions for App ID: ${latestApp.id}`);

        // We need to import the real service to use the new logic
        // But since this is a script, we'll manually instantiate the dependencies
        // Actually, easier to just trigger it via the backend logic if possible, 
        // but a standalone script is safer for a one-off.

        // Let's create a temporary script that uses the existing service via dist
        // Note: We need to point to the JS files in dist
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await AppDataSource.destroy();
    }
}
refreshQuestions();
