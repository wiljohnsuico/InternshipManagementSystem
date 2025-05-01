// Direct server startup script
console.log('Starting Internship Management System backend server...');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.USE_MOCK_DB = 'false';

// Import the application setup
const { app, startServer, DEFAULT_PORT } = require('./src/app.js');

// Start the server on the default port
(async function() {
    try {
        console.log(`Attempting to start server on port ${DEFAULT_PORT}...`);
        const server = await startServer(DEFAULT_PORT);
        console.log(`Server started successfully on port ${DEFAULT_PORT}`);
        
        // Add graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Closing server...');
            if (server) {
                server.close(() => {
                    console.log('Server closed.');
                    process.exit(0);
                });
            }
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
})(); 