const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.DID_API_KEY;
const url = 'https://api.d-id.com/talks/streams';

async function testDid() {
    console.log('Testing D-ID API Key (last 4 chars):', apiKey?.slice(-4));
    try {
        const response = await axios.post(url,
            { source_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg' },
            {
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Success!', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error setting up request:', error.message);
        }
        process.exit(1);
    }
}

testDid();
