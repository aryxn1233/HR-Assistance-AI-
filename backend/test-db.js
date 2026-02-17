const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'Aryxn@123',
    port: 5432,
});

client.connect()
    .then(() => {
        console.log('Connected successfully to 127.0.0.1');
        client.end();
    })
    .catch(err => {
        console.error('Connection to 127.0.0.1 failed:', err.message);

        // Try ::1
        const client6 = new Client({
            user: 'postgres',
            host: '::1',
            database: 'hr_platform',
            password: 'postgres',
            port: 5432,
        });

        return client6.connect()
            .then(() => {
                console.log('Connected successfully to ::1');
                client6.end();
            })
            .catch(err6 => {
                console.error('Connection to ::1 failed:', err6.message);
            });
    });
