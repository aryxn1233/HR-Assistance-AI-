const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Aryxn@123',
    port: 5432,
});

client.connect()
    .then(async () => {
        console.log('Connected to postgres db');
        try {
            await client.query('CREATE DATABASE hr_platform');
            console.log('Database hr_platform created successfully');
        } catch (err) {
            if (err.code === '42P04') {
                console.log('Database hr_platform already exists');
            } else {
                console.error('Failed to create database:', err.message);
            }
        }
        client.end();
    })
    .catch(err => {
        console.error('Initial connection failed:', err.message);
    });
