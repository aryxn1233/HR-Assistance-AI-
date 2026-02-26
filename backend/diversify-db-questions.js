
const { DataSource } = require('typeorm');
require('dotenv').config();

const entities = ["dist/**/*.entity.js"];

const AppDataSource = new DataSource({
    type: "postgres",
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "Aryxn@123",
    database: "hr_platform",
    synchronize: false,
    entities: entities,
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        const applicationRepo = AppDataSource.getRepository("Application");
        const latestApp = await applicationRepo.findOne({
            where: {},
            order: { createdAt: 'DESC' }
        });

        if (!latestApp) {
            console.error("No application found.");
            process.exit(1);
        }

        const currentQuestions = latestApp.interviewQuestions || [];
        const intro = "Hello! I'm your AI technical interviewer today. To get started, could you please introduce yourself and walk me through your professional background?";

        // Remove one question if already 20 to keep it at 20
        const updatedQuestions = [intro, ...currentQuestions.slice(0, 19)];

        await applicationRepo.update(latestApp.id, {
            interviewQuestions: updatedQuestions
        });

        console.log("Successfully updated database with introductory question.");
        console.log(`New Question 1: ${updatedQuestions[0]}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}
run();
