/**
 * Employer Dashboard Routes
 * Provides statistics and data for the employer dashboard
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { ValidationError } = require('../middleware/error-handler');

/**
 * @route GET /api/employer/dashboard/stats
 * @desc Get employer dashboard statistics
 * @access Private/Employer
 */
router.get('/dashboard/stats', async (req, res, next) => {
    try {
        // Get employer ID from user (would typically come from auth middleware)
        const employerId = req.user ? req.user.id : null;
        
        if (!employerId) {
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock statistics',
                active_jobs: 5,
                total_applications: 12,
                hired_interns: 3,
                pending_applications: 7
            });
        }
        
        // Get count of active jobs
        const [activeJobsResult] = await db.query(
            'SELECT COUNT(*) as count FROM job_listings_tbl WHERE company_id = ? AND is_active = TRUE AND is_deleted = FALSE',
            [employerId]
        );
        
        // Get count of total applications for this employer's jobs
        const [totalApplicationsResult] = await db.query(
            'SELECT COUNT(*) as count FROM applications_tbl a ' +
            'JOIN job_listings_tbl j ON a.job_id = j.id ' +
            'WHERE j.company_id = ? AND a.is_deleted = FALSE',
            [employerId]
        );
        
        // Get count of hired interns
        const [hiredInternsResult] = await db.query(
            'SELECT COUNT(*) as count FROM applications_tbl a ' +
            'JOIN job_listings_tbl j ON a.job_id = j.id ' +
            'WHERE j.company_id = ? AND a.status IN ("Accepted", "Hired") AND a.is_deleted = FALSE',
            [employerId]
        );
        
        // Get count of pending applications
        const [pendingApplicationsResult] = await db.query(
            'SELECT COUNT(*) as count FROM applications_tbl a ' +
            'JOIN job_listings_tbl j ON a.job_id = j.id ' +
            'WHERE j.company_id = ? AND a.status IN ("Pending", "Under Review") AND a.is_deleted = FALSE',
            [employerId]
        );
        
        res.status(200).json({
            success: true,
            active_jobs: activeJobsResult[0].count,
            total_applications: totalApplicationsResult[0].count,
            hired_interns: hiredInternsResult[0].count,
            pending_applications: pendingApplicationsResult[0].count
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/employer/recent-applications
 * @desc Get recent applications for employer
 * @access Private/Employer
 */
router.get('/recent-applications', async (req, res, next) => {
    try {
        // Get employer ID from user (would typically come from auth middleware)
        const employerId = req.user ? req.user.id : null;
        
        if (!employerId) {
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock data',
                recent_applications: getMockApplications()
            });
        }
        
        // Get recent applications
        const [recentApplications] = await db.query(
            'SELECT a.id, a.student_id, a.status, a.created_at, a.updated_at, ' +
            'j.title as job_title, u.name as student_name ' +
            'FROM applications_tbl a ' +
            'JOIN job_listings_tbl j ON a.job_id = j.id ' +
            'JOIN users_tbl u ON a.student_id = u.id ' +
            'WHERE j.company_id = ? AND a.is_deleted = FALSE ' +
            'ORDER BY a.updated_at DESC LIMIT 10',
            [employerId]
        );
        
        res.status(200).json({
            success: true,
            recent_applications: recentApplications
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/employer/applications/recent
 * @desc Alias for /api/employer/recent-applications to match frontend paths
 * @access Private/Employer
 */
router.get('/applications/recent', async (req, res, next) => {
    try {
        // Get limit parameter or default to 5
        const limit = parseInt(req.query.limit) || 5;
        
        // Get employer ID from user (would typically come from auth middleware)
        const employerId = req.user ? req.user.id : null;
        
        if (!employerId) {
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock data',
                applications: getMockApplications().slice(0, limit)
            });
        }
        
        // Get recent applications with limit
        const [recentApplications] = await db.query(
            'SELECT a.id, a.student_id, a.status, a.created_at, a.updated_at, ' +
            'j.title as job_title, u.name as student_name ' +
            'FROM applications_tbl a ' +
            'JOIN job_listings_tbl j ON a.job_id = j.id ' +
            'JOIN users_tbl u ON a.student_id = u.id ' +
            'WHERE j.company_id = ? AND a.is_deleted = FALSE ' +
            'ORDER BY a.updated_at DESC LIMIT ?',
            [employerId, limit]
        );
        
        res.status(200).json({
            success: true,
            applications: recentApplications
        });
    } catch (error) {
        console.error('Error fetching recent applications:', error);
        res.status(200).json({
            success: true,
            message: 'Error fetching applications, using mock data',
            applications: getMockApplications().slice(0, parseInt(req.query.limit) || 5)
        });
    }
});

/**
 * @route GET /api/employer/jobs/active
 * @desc Get active job listings for an employer with limit
 * @access Private/Employer
 */
router.get('/jobs/active', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        // Get employer ID from user (would typically come from auth middleware)
        const employerId = req.user ? req.user.id : null;
        const companyId = req.user ? req.user.company_id : null;
        
        if (!companyId) {
            return res.status(200).json({
                success: true,
                message: 'Demo mode: Using mock data',
                jobs: getMockJobs().filter(job => job.status === 'Active').slice(0, limit)
            });
        }
        
        // Get active jobs
        const [activeJobs] = await db.query(
            'SELECT * FROM job_listings_tbl ' +
            'WHERE company_id = ? AND status = "Active" AND is_deleted = FALSE ' +
            'ORDER BY created_at DESC LIMIT ?',
            [companyId, limit]
        );
        
        res.status(200).json({
            success: true,
            jobs: activeJobs
        });
    } catch (error) {
        console.error('Error fetching active jobs:', error);
        res.status(200).json({
            success: true,
            message: 'Error fetching jobs, using mock data',
            jobs: getMockJobs().filter(job => job.status === 'Active').slice(0, parseInt(req.query.limit) || 5)
        });
    }
});

/**
 * Mock applications for development/demo mode
 */
function getMockApplications() {
    return [
        {
            id: 'app-001',
            student_id: 'stu-101',
            status: 'Pending',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            job_title: 'Frontend Developer Intern',
            student_name: 'John Doe'
        },
        {
            id: 'app-002',
            student_id: 'stu-102',
            status: 'Under Review',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            job_title: 'Backend Developer Intern',
            student_name: 'Jane Smith'
        },
        {
            id: 'app-003',
            student_id: 'stu-103',
            status: 'Accepted',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            job_title: 'Full Stack Developer Intern',
            student_name: 'Alex Johnson'
        }
    ];
}

/**
 * Mock jobs for development/demo mode
 */
function getMockJobs() {
    return [
        {
            id: 1,
            title: 'Frontend Developer Intern',
            company_id: 1,
            status: 'Active',
            description: 'Frontend development internship position',
            location: 'Manila',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
            id: 2,
            title: 'Backend Developer Intern',
            company_id: 1,
            status: 'Active',
            description: 'Backend development using Node.js',
            location: 'Quezon City',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
            id: 3,
            title: 'UI/UX Design Intern',
            company_id: 1,
            status: 'Inactive',
            description: 'UI/UX design internship',
            location: 'Remote',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
    ];
}

module.exports = router; 