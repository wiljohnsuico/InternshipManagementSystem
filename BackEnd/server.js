// Direct server startup script
console.log('Starting Internship Management System backend server...');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.USE_MOCK_DB = process.env.USE_MOCK_DB || 'false';

// Import the application setup
const { app, startServer, DEFAULT_PORT } = require('./src/app.js');

// Start the server on the default port
(async function() {
    let server = null;
    let shutdownInProgress = false;
    
    // Handle graceful shutdown
    function gracefulShutdown(signal) {
        if (shutdownInProgress) return;
        shutdownInProgress = true;
        
        console.log(`${signal} received. Closing server gracefully...`);
        if (server) {
            server.close(() => {
                console.log('HTTP server closed.');
                // Give some time for ongoing requests to finish
                setTimeout(() => {
                    console.log('Exiting process.');
                    process.exit(0);
                }, 1000);
            });
            
            // Force shutdown after 10 seconds if graceful shutdown fails
            setTimeout(() => {
                console.log('Forcing server shutdown after timeout');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    }
    
    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('UNCAUGHT EXCEPTION:');
        console.error(error);
        gracefulShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('UNHANDLED PROMISE REJECTION:');
        console.error(reason);
        gracefulShutdown('unhandledRejection');
    });
    
    try {
        console.log(`Attempting to start server on port ${DEFAULT_PORT}...`);
        server = await startServer(DEFAULT_PORT);
        console.log(`Server started successfully on port ${DEFAULT_PORT}`);
    } catch (error) {
        console.error('Error starting server:', error);
        
        // Try alternative port if the default port is in use
        if (error.message && error.message.includes('already in use')) {
            const ALT_PORT = DEFAULT_PORT + 1;
            console.log(`Port ${DEFAULT_PORT} is in use. Trying alternative port ${ALT_PORT}...`);
            
            try {
                server = await startServer(ALT_PORT);
                console.log(`Server started successfully on alternate port ${ALT_PORT}`);
            } catch (altError) {
                console.error('Error starting server on alternative port:', altError);
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    }
})(); 