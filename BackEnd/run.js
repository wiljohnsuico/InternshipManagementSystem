// Simple server runner with better error handling
console.log('Starting Internship Management System backend server...');

// Import required modules
const path = require('path');
const fs = require('fs');

// Check for app.js existence
const appJsPath = path.join(__dirname, 'src', 'app.js');
if (!fs.existsSync(appJsPath)) {
    console.error(`ERROR: Cannot find ${appJsPath}`);
    console.error('Make sure you are running this script from the BackEnd directory');
    process.exit(1);
}

try {
    // Set environment variables
    process.env.NODE_ENV = 'development';
    process.env.USE_MOCK_DB = 'false';
    
    // Import the application
    const { startServer, DEFAULT_PORT } = require('./src/app.js');
    
    // Start the server
    (async () => {
        try {
            console.log(`Starting server on port ${DEFAULT_PORT}...`);
            await startServer(DEFAULT_PORT);
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    })();
} catch (error) {
    console.error('Error importing or starting the application:', error);
    process.exit(1); 