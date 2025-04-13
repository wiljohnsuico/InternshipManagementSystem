const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Submit daily accomplishment (Intern only)
router.post('/daily', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const { date, task_completed, challenges_faced, skills_applied } = req.body;
        const intern_id = req.user.id;

        // Validate required fields
        if (!date || !task_completed || !challenges_faced || !skills_applied) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Get company ID from active internship
        const [internships] = await pool.query(`
            SELECT company_id FROM internship_placements_tbl
            WHERE intern_id = ? AND placement_status = 'Approved'
            AND start_date <= ? AND end_date >= ?
        `, [intern_id, date, date]);

        if (internships.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active internship found for this date'
            });
        }

        const company_id = internships[0].company_id;

        // Submit accomplishment
        await pool.query(`
            INSERT INTO daily_accomplishment_tbl (
                intern_id, company_id, date,
                task_completed, challenges_faced, skills_applied
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [intern_id, company_id, date, task_completed, challenges_faced, skills_applied]);

        res.status(201).json({
            success: true,
            message: 'Daily accomplishment submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting daily accomplishment:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting daily accomplishment'
        });
    }
});

// Submit attendance (Intern only)
router.post('/attendance', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const { date, time_in, time_out, remarks } = req.body;
        const intern_id = req.user.id;

        // Validate required fields
        if (!date || !time_in) {
            return res.status(400).json({
                success: false,
                message: 'Please provide date and time in'
            });
        }

        // Get company ID from active internship
        const [internships] = await pool.query(`
            SELECT company_id FROM internship_placements_tbl
            WHERE intern_id = ? AND placement_status = 'Approved'
            AND start_date <= ? AND end_date >= ?
        `, [intern_id, date, date]);

        if (internships.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active internship found for this date'
            });
        }

        const company_id = internships[0].company_id;

        // Calculate duration in hours
        const duration = time_out ? 
            Math.round((new Date(time_out) - new Date(time_in)) / (1000 * 60 * 60)) : 
            null;

        // Submit attendance
        await pool.query(`
            INSERT INTO attendance_tracking_tbl (
                intern_id, company_id, date, time_in,
                time_out, duration, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [intern_id, company_id, date, time_in, time_out, duration, remarks]);

        res.status(201).json({
            success: true,
            message: 'Attendance submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting attendance'
        });
    }
});

// Get accomplishments for an intern
router.get('/intern', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;

        const [accomplishments] = await pool.query(`
            SELECT * FROM daily_accomplishment_tbl
            WHERE intern_id = ?
            ORDER BY date DESC
        `, [intern_id]);

        res.json({
            success: true,
            data: accomplishments
        });
    } catch (error) {
        console.error('Error fetching accomplishments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching accomplishments'
        });
    }
});

// Get attendance for an intern
router.get('/attendance/intern', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;

        const [attendance] = await pool.query(`
            SELECT * FROM attendance_tracking_tbl
            WHERE intern_id = ?
            ORDER BY date DESC
        `, [intern_id]);

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance'
        });
    }
});

// Get intern accomplishments (Employer only)
router.get('/intern/:intern_id', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const { intern_id } = req.params;
        const employer_id = req.user.id;

        // Verify employer has access to this intern's data
        const [access] = await pool.query(`
            SELECT 1 FROM internship_placements_tbl ip
            JOIN employers_tbl e ON ip.company_id = e.company_id
            WHERE ip.intern_id = ? AND e.employer_id = ?
        `, [intern_id, employer_id]);

        if (access.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this intern\'s data'
            });
        }

        const [accomplishments] = await pool.query(`
            SELECT * FROM daily_accomplishment_tbl
            WHERE intern_id = ?
            ORDER BY date DESC
        `, [intern_id]);

        res.json({
            success: true,
            data: accomplishments
        });
    } catch (error) {
        console.error('Error fetching intern accomplishments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching intern accomplishments'
        });
    }
});

module.exports = router; 