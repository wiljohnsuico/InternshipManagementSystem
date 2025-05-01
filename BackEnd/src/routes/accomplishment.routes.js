const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const path = require('path');
const fs = require('fs');

// Status endpoint for server discovery (no auth required)
router.get('/status', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Accomplishment API is running',
        timestamp: new Date().toISOString()
    });
});

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
                message: 'No active internship found for this date. Please ensure you have an approved internship placement that covers this date.'
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
                message: 'No active internship found for this date. Please ensure you have an approved internship placement that covers this date.'
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

// Generate report (Intern only)
router.post('/report', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        
        // Ensure the uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Fetch intern details
        const [internDetails] = await pool.query(`
            SELECT i.*, u.first_name, u.last_name, u.email 
            FROM interns_tbl i
            JOIN users_tbl u ON i.user_id = u.user_id
            WHERE i.id = ?
        `, [intern_id]);
        
        if (internDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found'
            });
        }
        
        // Fetch attendance records
        const [attendance] = await pool.query(`
            SELECT a.*, c.company_name 
            FROM attendance_tracking_tbl a
            JOIN companies_tbl c ON a.company_id = c.company_id
            WHERE a.intern_id = ?
            ORDER BY a.date DESC
        `, [intern_id]);
        
        // Fetch accomplishment records
        const [accomplishments] = await pool.query(`
            SELECT a.*, c.company_name 
            FROM daily_accomplishment_tbl a
            JOIN companies_tbl c ON a.company_id = c.company_id
            WHERE a.intern_id = ?
            ORDER BY a.date DESC
        `, [intern_id]);
        
        // Generate PDF filename
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
        const filename = `intern_report_${intern_id}_${timestamp}.pdf`;
        const filePath = path.join(uploadsDir, filename);
        
        // The PDF generation would typically happen here with a library like PDFKit
        // For the MVP, we'll just return the data for client-side PDF generation
        
        // Return data to client for client-side PDF generation
        res.json({
            success: true,
            message: 'Report data retrieved successfully',
            data: {
                intern: internDetails[0],
                attendance: attendance,
                accomplishments: accomplishments,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating report'
        });
    }
});

module.exports = router; 