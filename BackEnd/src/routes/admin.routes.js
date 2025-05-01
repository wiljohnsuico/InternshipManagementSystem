const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Status endpoint for server discovery (no auth required)
router.get('/status', adminController.apiStatus);

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin route for getting all interns
router.get('/interns', adminController.getAllInterns);

// Admin route for updating intern status
router.patch('/interns/:id/status', adminController.updateInternStatus);

// Admin route for updating intern details
router.put('/interns/:id', adminController.updateIntern);

// Admin route for deleting an intern
router.delete('/interns/:id', adminController.deleteIntern);

// Admin route for archiving an intern
router.put('/interns/:id/archive', adminController.archiveIntern);

// Admin route for getting all archived interns
router.get('/archived/interns', adminController.getArchivedInterns);

// Admin route for restoring archived interns
router.put('/archived/interns/:id/restore', adminController.restoreArchivedIntern);

// Admin route for permanently deleting archived interns
router.delete('/archived/interns/:id/permanent', adminController.permanentlyDeleteArchivedIntern);

// Admin route for getting all faculty
router.get('/faculties', adminController.getAllFaculty);

// Admin route for creating faculty
router.post('/faculties', adminController.createFaculty);

// Admin route for updating faculty
router.put('/faculties/:id', adminController.updateFaculty);

// Admin route for deleting faculty
router.delete('/faculties/:id', adminController.deleteFaculty);

// Admin route for archiving faculty
router.put('/faculties/:id/archive', adminController.archiveFaculty);

// Admin route for getting all employers
router.get('/employers', adminController.getAllEmployers);

// Admin route for creating employer
router.post('/employers', adminController.createEmployer);

// Admin route for updating employer
router.put('/employers/:id', adminController.updateEmployer);

// Admin route for deleting employer
router.delete('/employers/:id', adminController.deleteEmployer);

// Admin route for archiving employer
router.put('/employers/:id/archive', adminController.archiveEmployer);

// Admin route for getting all companies
router.get('/companies', adminController.getAllCompanies);

// Admin route for creating company
router.post('/companies', adminController.createCompany);

// Admin route for updating company
router.put('/companies/:id', adminController.updateCompany);

// Admin route for deleting company
router.delete('/companies/:id', adminController.deleteCompany);

// Admin route for archiving company
router.put('/companies/:id/archive', adminController.archiveCompany);

// Admin route for getting all archived companies
router.get('/archived/companies', adminController.getArchivedCompanies);

// Admin route for getting all archived faculty
router.get('/archived/faculties', adminController.getArchivedFaculty);

// Admin route for getting all archived employers
router.get('/archived/employers', adminController.getArchivedEmployers);

// Routes for restoring archived items
router.put('/archived/companies/:id/restore', adminController.restoreArchivedCompany);
router.put('/archived/faculties/:id/restore', adminController.restoreArchivedFaculty);
router.put('/archived/employers/:id/restore', adminController.restoreArchivedEmployer);

// Routes for permanently deleting archived items
router.delete('/archived/companies/:id/permanent', adminController.permanentlyDeleteArchivedCompany);
router.delete('/archived/faculties/:id/permanent', adminController.permanentlyDeleteArchivedFaculty);
router.delete('/archived/employers/:id/permanent', adminController.permanentlyDeleteArchivedEmployer);

// Debug routes for testing - REMOVE IN PRODUCTION
router.get('/test/intern-archive/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Test archive endpoint called with ID:', id);
        
        // Create a mock admin user for the request
        req.user = { user_id: 1, role: 'Admin' };
        
        // Call the archive function directly
        await adminController.archiveIntern(req, res);
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in test endpoint',
            error: error.message,
            stack: error.stack
        });
    }
});

// Admin dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Admin routes for internship attendance tracking
router.get('/attendance', adminController.getAllInternsAttendance);
router.get('/attendance/summary', adminController.getAttendanceSummary);
router.get('/attendance/date/:date', adminController.getAttendanceByDate);
router.get('/attendance/intern/:internId', adminController.getInternAttendance);

module.exports = router; 