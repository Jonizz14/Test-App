const fetch = require('node-fetch');

async function testAPI() {
    try {
        // Try without authentication first
        const response = await fetch('http://localhost:8000/api/users/');
        if (response.ok) {
            const data = await response.json();
            console.log('Sample user data:', JSON.stringify(data[0], null, 2));
            
        } else {
            console.log('Status:', response.status);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPI();