const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const fs = require('fs');
const util = require('util');
const { errorHandler } = require('./middleware/error-handler');
const ensureDirs = require('./utils/ensure-directories');
require('dotenv').config();

const app = express();

// Ensure required directories exist
console.log('Checking required directories...');
ensureDirs.ensureAllDirectories();

// CORS configuration - must be first!
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check against whitelist or allow all in development
        const whitelist = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : [];
            
        if (whitelist.length === 0 || whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 1 day in seconds
}));

// --- HEALTH CHECK ROUTE ---
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// --------------------------

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
const errorReportRoutes = require('./routes/error-report.routes');
const employerDashboardRoutes = require('./routes/employer-dashboard.routes');

// Import migration scripts
const runAdminMigration = require('./config/run-admin-migration');

// Log CORS issues
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (process.env.NODE_ENV === 'development') {
        console.log(`Request from origin: ${origin || 'unknown'}`);
    }
    
    // Add CORS headers manually to ensure they're present
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    
    next();
});

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Parse JSON request bodies with increased limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the student directory
// This assumes your student folder is at the project root level
app.use(express.static(path.join(__dirname, '../../')));

// Set up serving static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

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

// Request logging - only in development or if DEBUG=true
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        // Don't log the entire body for large requests
        if (req.method === 'POST' && (req.url.includes('/resume') || req.url.includes('/upload'))) {
            console.log('Request body: [Large data - too large to log]');
        } else if (req.url.includes('/auth') && req.body && req.body.password) {
            const sanitizedBody = { ...req.body, password: '[REDACTED]' };
            console.log('Request body:', sanitizedBody);
        } else {
            console.log('Request body:', req.body);
        }
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
app.use('/api/errors', errorReportRoutes);
app.use('/api/employer', employerDashboardRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Internship Management System API' });
});

// API Status route for server discovery (no auth required)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - always returns 200 if server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Run table setup scripts
async function setupDatabaseTables() {
  try {
    console.log('Setting up database tables...');
    
    // Check database connection first
    const isConnected = await db.isDbConnected();
    if (!isConnected) {
      console.error('Cannot set up database tables - database connection failed');
      return false;
    }
    
    // Read and execute report tables script
    const reportTablesPath = path.join(__dirname, 'config', 'report_tables.sql');
    if (fs.existsSync(reportTablesPath)) {
      console.log('Executing report_tables.sql script...');
      try {
        const reportTablesSQL = fs.readFileSync(reportTablesPath, 'utf8');
        await db.query(reportTablesSQL);
        console.log('Successfully executed report_tables.sql script');
      } catch (error) {
        console.error('Error executing report_tables.sql script:', error.message);
        // Continue execution - non-critical table
      }
    }
    
    // Read and execute notification tables script
    const notificationTablesPath = path.join(__dirname, 'config', 'notification_tables.sql');
    if (fs.existsSync(notificationTablesPath)) {
      console.log('Executing notification_tables.sql script...');
      try {
        const notificationTablesSQL = fs.readFileSync(notificationTablesPath, 'utf8');
        await db.query(notificationTablesSQL);
        console.log('Successfully executed notification_tables.sql script');
      } catch (error) {
        console.error('Error executing notification_tables.sql script:', error.message);
        // Continue execution - non-critical table
      }
    }
    
    // Read and execute job listings table script
    const jobListingsTablePath = path.join(__dirname, 'config', 'job_listings_table.sql');
    if (fs.existsSync(jobListingsTablePath)) {
      console.log('Executing job_listings_table.sql script...');
      try {
        const jobListingsTableSQL = fs.readFileSync(jobListingsTablePath, 'utf8');
        await db.query(jobListingsTableSQL);
        console.log('Successfully executed job_listings_table.sql script');
      } catch (error) {
        console.error('Error executing job_listings_table.sql script:', error.message);
        // Continue execution - but this is important for jobs functionality
      }
    } else {
      console.warn('job_listings_table.sql not found. Job listings functionality may not work correctly.');
    }
    
    // Run admin migration script
    try {
      await runAdminMigration();
    } catch (error) {
      console.error('Error running admin migration:', error.message);
      // Continue execution - non-critical
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database tables:', error);
    return false;
  }
}

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Use the centralized error handler
app.use(errorHandler);

// Port configuration
const DEFAULT_PORT = 5004;

// Function to start the server on a given port
async function startServer(port) {
    try {
        // Set up database tables first
        const databaseSetupSuccess = await setupDatabaseTables();
        if (!databaseSetupSuccess) {
            console.warn('Database setup had issues. The server will start, but some features may not work correctly.');
        }
        
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
