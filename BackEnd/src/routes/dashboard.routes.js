// BackEnd/src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateEmployer, authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/employers/dashboard/stats
router.get('/employers/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Make sure the user is an employer
        const userId = req.user.user_id;
        const role = req.user.role;
        
        if (role !== 'Employer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only employers can access this resource.'
            });
        }

        // Active jobs
        const [activeJobs] = await db.query(
            `SELECT COUNT(*) AS count 
             FROM job_listings j
             JOIN employers_tbl e ON j.company_id = e.company_id
             WHERE e.user_id = ? AND j.status = "Active"`,
            [userId]
        );

        // Total applications
        const [totalApplications] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             JOIN employers_tbl e ON j.company_id = e.company_id
             WHERE e.user_id = ?`,
            [userId]
        );

        // Hired interns
        const [hiredInterns] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             JOIN employers_tbl e ON j.company_id = e.company_id
             WHERE e.user_id = ? AND (a.status = "Accepted" OR a.status = "Hired" OR a.status = "Interviewed")`,
            [userId]
        );

        // Pending applications
        const [pendingApplications] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             JOIN employers_tbl e ON j.company_id = e.company_id
             WHERE e.user_id = ? AND a.status = "Pending"`,
            [userId]
        );

        res.json({
            success: true,
            active_jobs: activeJobs[0].count,
            total_applications: totalApplications[0].count,
            hired_interns: hiredInterns[0].count,
            pending_applications: pendingApplications[0].count
        });
    } catch (err) {
        console.error('Error fetching employer dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
    }
});

// GET /api/dashboard/applications/employer/recent
router.get('/applications/employer/recent', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Employer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only employers can access this resource.'
            });
        }

        const userId = req.user.user_id;
        const [recentApps] = await db.query(
            `SELECT a.*, s.first_name, s.last_name, j.job_title
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             JOIN interns_tbl s ON a.intern_id = s.id
             JOIN employers_tbl e ON j.company_id = e.company_id
             WHERE e.user_id = ?
             ORDER BY a.created_at DESC
             LIMIT 5`,
            [userId]
        );
        
        // Format the results for consistency
        const formattedApps = recentApps.map(app => ({
            id: app.application_id,
            studentName: `${app.first_name} ${app.last_name}`,
            jobTitle: app.job_title,
            appliedDate: app.created_at,
            status: app.status
        }));
        
        res.json({
            success: true,
            applications: formattedApps
        });
    } catch (err) {
        console.error('Error fetching recent applications:', err);
        res.status(500).json({ success: false, message: 'Failed to load recent applications' });
    }
});

module.exports = router;