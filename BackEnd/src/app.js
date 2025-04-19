const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
const fs = require('fs');
const util = require('util');
require('dotenv').config();

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

const app = express();

// CORS configuration - Allow development requests from anywhere
app.use(cors({
    origin: true,  // Allow requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

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

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Don't log the entire body for large requests
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

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Internship Management System API' });
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
  } catch (error) {
    console.error('Error setting up database tables:', error);
  }
}

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

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Port configuration
const PORT = process.env.PORT || 5004;
console.log('Using PORT:', PORT);

// Start server after short delay to allow DB init
let server;
setTimeout(async () => {
    try {
        // Set up database tables first
        await setupDatabaseTables();
        
        server = app.listen(PORT, () => {
            console.log(`✅ Backend server is running on port ${PORT}`);
        }).on('error', (err) => {
            console.error('❌ Server failed to start:', err);
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use.`);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
}, 2000);

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
