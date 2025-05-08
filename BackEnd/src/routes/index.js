const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
//const companyRoutes = require('./company.routes');
const internRoutes = require('./intern.routes');
//const facultyRoutes = require('./faculty.routes');
const jobRoutes = require('./job.routes');
const resumeRoutes = require('./resume.routes');
const appRoutes = require('./application.routes');
const notificationRoutes = require('./notification.routes');
const employerRoutes = require('./employer.routes');
const dashboardRoutes = require('./dashboard.routes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
//router.use('/companies', companyRoutes);
router.use('/interns', internRoutes);
//router.use('/faculty', facultyRoutes);
router.use('/jobs', jobRoutes);
router.use('/resumes', resumeRoutes);
router.use('/applications', appRoutes);
router.use('/notifications', notificationRoutes);
router.use('/employers', employerRoutes);
router.use('/dashboard', dashboardRoutes);

// Additional API endpoints for employer dashboard
router.get('/employer/dashboard/stats', async (req, res) => {
    try {
        // Forward to the proper endpoint
        res.redirect(307, '/api/dashboard/employers/dashboard/stats');
    } catch (error) {
        console.error('Error in employer dashboard stats redirect:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in dashboard stats'
        });
    }
});

// Add a GET endpoint for recent applications
router.get('/employer/applications/recent', async (req, res) => {
    try {
        // Forward to the proper endpoint
        res.redirect(307, '/api/dashboard/applications/employer/recent');
    } catch (error) {
        console.error('Error in recent applications redirect:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in recent applications'
        });
    }
});

// Add a GET endpoint for active jobs
router.get('/employer/jobs/active', async (req, res) => {
    try {
        // Forward to the proper endpoint
        res.redirect(307, '/api/jobs/employer/my-listings');
    } catch (error) {
        console.error('Error in active jobs redirect:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in active jobs'
        });
    }
});

module.exports = router; 