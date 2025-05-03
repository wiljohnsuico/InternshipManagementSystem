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

module.exports = router; 