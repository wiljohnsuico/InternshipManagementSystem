// BackEnd/src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateEmployer } = require('../middleware/auth');

// GET /api/employers/dashboard/stats
router.get('/employers/dashboard/stats', authenticateEmployer, async (req, res) => {
    try {
        const employerId = req.user.user_id; // or req.user.id, depending on your JWT

        // Active jobs
        const [activeJobs] = await db.query(
            'SELECT COUNT(*) AS count FROM job_listings WHERE employer_id = ? AND status = "Active"',
            [employerId]
        );

        // Total applications
        const [totalApplications] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             WHERE j.employer_id = ?`,
            [employerId]
        );

        // Hired interns
        const [hiredInterns] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             WHERE j.employer_id = ? AND a.status = "Hired"`,
            [employerId]
        );

        // Pending applications
        const [pendingApplications] = await db.query(
            `SELECT COUNT(*) AS count
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             WHERE j.employer_id = ? AND a.status = "Pending"`,
            [employerId]
        );

        res.json({
            active_jobs: activeJobs[0].count,
            total_applications: totalApplications[0].count,
            hired_interns: hiredInterns[0].count,
            pending_applications: pendingApplications[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
    }
});

// GET /api/applications/employer/recent
router.get('/applications/employer/recent', authenticateEmployer, async (req, res) => {
    try {
        const employerId = req.user.user_id;
        const [recentApps] = await db.query(
            `SELECT a.*, s.first_name, s.last_name, j.job_title
             FROM applications a
             JOIN job_listings j ON a.listing_id = j.listing_id
             JOIN interns_tbl s ON a.intern_id = s.id
             WHERE j.employer_id = ?
             ORDER BY a.created_at DESC
             LIMIT 5`,
            [employerId]
        );
        res.json(recentApps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to load recent applications' });
    }
});

module.exports = router;