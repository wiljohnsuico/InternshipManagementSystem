const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./config/database');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const internRoutes = require('./routes/intern.routes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3500',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request body:', req.body);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Internship Management System API' });
});

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

// Handle 404 routes
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

// Start server after database initialization
let server;
setTimeout(() => {
    server = app.listen(PORT, () => {
        console.log(`Backend server is running on port ${PORT}`);
    }).on('error', (err) => {
        console.error('Server failed to start:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please try a different port.`);
        }
        process.exit(1);
    });
}, 2000); // Give database 2 seconds to initialize

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server...');
    if (server) {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }
}); 