const express = require('express');
const app = express();
const PORT = 5004;
const db = require('./config/database');
const cors = require('cors');

app.get('/test', (req, res) => {
    console.log('✅ Test route hit!');
    res.json({ message: 'Test route working!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

/*
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const util = require('util');
const fileUpload = require('express-fileupload');
require('dotenv').config();
*/


// Import routes
const authRoutes = require('./routes/auth.routes');
const internRoutes = require('./routes/intern.routes');
const resumeRoutes = require('./routes/resume.routes');
const userRoutes = require('./routes/user.routes');
const accomplishmentRoutes = require('./routes/accomplishment.routes');
const applicationRoutes = require('./routes/application.routes');
const internshipRoutes = require('./routes/internship.routes');
const jobRoutes = require('./routes/job.routes');
const reportRoutes = require('./routes/report.routes');
const announcementRoutes = require('./routes/announcements.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const statusRoutes = require('./routes/status');
const employerRoutes = require('./routes/employer.routes');

// Import migration scripts
const runAdminMigration = require('./config/run-admin-migration');

// CORS configuration - Allow development requests from anywhere
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://localhost:5004', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Log CORS issues
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`Request from origin: ${origin || 'unknown'}`);
    
    // Add CORS headers manually to ensure they're present
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    next();
});

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Parse JSON request bodies with increased limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true // Set to true for debugging
}));

// Serve static files from the student directory
app.use(express.static(path.join(__dirname, '../../')));

// Set up serving static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

/*
// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
*/

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url.includes('/resume')) {
        console.log('Request body: [Resume data - too large to log]');
    } else {
        console.log('Request body:', req.body);
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/accomplishments', accomplishmentRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/employers', employerRoutes);

/*
// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Internship Management System API' });
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Status route for server discovery (no auth required)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// Run table setup scripts
async function setupDatabaseTables() {
  try {
    console.log('Setting up database tables...');
    
    // Read and execute report tables script
    const reportTablesPath = path.join(__dirname, 'config', 'report_tables.sql');
    if (fs.existsSync(reportTablesPath)) {
      console.log('Executing report_tables.sql script...');
      const reportTablesSQL = fs.readFileSync(reportTablesPath, 'utf8');
      await db.query(reportTablesSQL);
      console.log('Successfully executed report_tables.sql script');
    }
    
    // Read and execute notification tables script
    const notificationTablesPath = path.join(__dirname, 'config', 'notification_tables.sql');
    if (fs.existsSync(notificationTablesPath)) {
      console.log('Executing notification_tables.sql script...');
      const notificationTablesSQL = fs.readFileSync(notificationTablesPath, 'utf8');
      await db.query(notificationTablesSQL);
      console.log('Successfully executed notification_tables.sql script');
    }
    
    // Run admin migration script
    await runAdminMigration();
  } catch (error) {
    console.error('Error setting up database tables:', error);
  }
}
*/

/*
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        path: req.path,
        method: req.method,
        body: req.body
    });

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
*/

/*
// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
*/


/*
// Port configuration
const DEFAULT_PORT = 5004;

// Function to start the server on a given port
async function startServer(port) {
    try {
        // Set up database tables first
        await setupDatabaseTables();
        
        console.log(`Attempting to start server on port ${port}...`);
        return new Promise((resolve, reject) => {
            const serverInstance = app.listen(port, () => {
                console.log(`✅ Backend server is running on port ${port}`);
                resolve(serverInstance);
            }).on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`Port ${port} is already in use.`);
                    reject(new Error(`Port ${port} already in use`));
                } else {
                    console.error('❌ Server failed to start:', err);
                    reject(err);
                }
            });
        });
    } catch (error) {
        console.error('Error during server startup:', error);
        throw error;
    }
}

// Export the setup function and server initialization
// This allows the user to manually start the server
module.exports = {
    app,
    setupDatabaseTables,
    startServer,
    DEFAULT_PORT
};

// Only start the server if this file is run directly (not required/imported)
if (require.main === module) {
    // Start server after short delay to allow DB init
    setTimeout(async () => {
            try {
            console.log(`Starting server on port ${DEFAULT_PORT}...`);
            const server = await startServer(DEFAULT_PORT);
        
        // Graceful shutdown
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
            console.error('Fatal error during server startup:', error);
            process.exit(1);
        }
    }, 2000);
}
*/