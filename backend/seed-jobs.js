const { Client } = require('pg');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Aryxn@123',
    database: process.env.DB_NAME || 'hr_platform',
});

const jobs = [
    {
        title: 'Information Security Analyst',
        description: 'We are looking for an Information Security professional to protect our systems. Expertise in security audits, penetration testing, and compliance is required.',
        department: 'Security',
        requiredSkills: ['Security', 'Cybersecurity', 'Audit', 'Compliance', 'Penetration Testing'],
        type: 'Full-time'
    },
    {
        title: 'Senior Java Developer',
        description: 'Seeking a Java expert for our backend services. Experience with Spring Boot, Hibernate, and Microservices is essential.',
        department: 'Engineering',
        requiredSkills: ['Java', 'Spring Boot', 'Hibernate', 'Microservices', 'SQL'],
        type: 'Full-time'
    },
    {
        title: 'Python Data Engineer',
        description: 'Expertise in Python for data pipelines. Proficient in pandas, numpy, and big data technologies.',
        department: 'Data',
        requiredSkills: ['Python', 'Pandas', 'Numpy', 'SQL', 'Data Engineering'],
        type: 'Full-time'
    },
    {
        title: 'AI/ML Research Scientist',
        description: 'Lead AI initiatives using machine learning and deep learning models. Expertise in PyTorch or TensorFlow.',
        department: 'AI',
        requiredSkills: ['AI', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Python'],
        type: 'Full-time'
    },
    {
        title: 'Blockchain Developer',
        description: 'Develop smart contracts and decentralized applications. Solidity and Ethereum knowledge is a must.',
        department: 'Engineering',
        requiredSkills: ['Blockchain', 'Solidity', 'Ethereum', 'Smart Contracts', 'Web3'],
        type: 'Full-time'
    },
    {
        title: 'PHP Full Stack Developer',
        description: 'Maintaining and scaling PHP-based web applications. Laravel experience preferred.',
        department: 'Web',
        requiredSkills: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'HTML/CSS'],
        type: 'Full-time'
    },
    {
        title: 'SAP Consultant',
        description: 'Implementation and optimization of SAP modules. ERP experience required.',
        department: 'Business Systems',
        requiredSkills: ['SAP', 'ERP', 'ABAP', 'HANA', 'Business Analysis'],
        type: 'Full-time'
    }
];

async function seed() {
    try {
        await client.connect();
        console.log('Connected to database.');

        for (const job of jobs) {
            const id = uuidv4();
            const createdAt = new Date().toISOString();
            const updatedAt = createdAt;
            const requiredSkills = `{${job.requiredSkills.join(',')}}`; // PostgreSQL simple-array format

            const query = `
        INSERT INTO jobs (id, title, description, department, location, type, "requiredSkills", "minExperience", status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

            const values = [
                id,
                job.title,
                job.description,
                job.department,
                'Remote',
                job.type,
                job.requiredSkills.join(','), // simple-array in typeorm is comma separated string
                2,
                'Active',
                createdAt,
                updatedAt
            ];

            await client.query(query, values);
            console.log(`Seeded job: ${job.title}`);
        }

        console.log('Successfully seeded all jobs.');
    } catch (err) {
        console.error('Error seeding jobs:', err);
    } finally {
        await client.end();
    }
}

seed();
