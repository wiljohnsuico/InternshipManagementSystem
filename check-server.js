/**
 * Simple script to check if the backend server is running and accessible
 * Use: node check-server.js
 */

const http = require('http');

// Function to check if server is running
function checkServerStatus() {
    console.log('Checking if backend server is running at http://localhost:5004...');

    // HTTP GET request options
    const options = {
        hostname: 'localhost',
        port: 5004,
        path: '/api/status',
        method: 'GET',
        timeout: 5000 // 5 second timeout
    };

    // Create the request
    const req = http.request(options, (res) => {
        console.log(`Server response status code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
            console.log('✅ Backend server is running and accessible');
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('Server status:', parsed);
                } catch (error) {
                    console.error('Error parsing server response:', error.message);
                }
            });
        } else {
            console.error(`❌ Server returned error status code: ${res.statusCode}`);
        }
    });

    // Handle request errors
    req.on('error', (error) => {
        console.error('❌ Error connecting to backend server:', error.message);
        console.log('\nPossible reasons:');
        console.log('1. The backend server is not running');
        console.log('2. There might be a firewall blocking the connection');
        console.log('3. The port might be in use by another application');
        
        console.log('\nTroubleshooting steps:');
        console.log('1. Make sure the backend server is running (cd BackEnd && node start-server.js)');
        console.log('2. Check if port 5004 is in use: netstat -ano | findstr :5004');
        console.log('3. Try killing any processes using the port and restart the server');
    });

    // Set request timeout
    req.on('timeout', () => {
        console.error('❌ Request timed out after 5 seconds');
        req.destroy();
    });

    // End the request
    req.end();
}

// Run the check
checkServerStatus(); 