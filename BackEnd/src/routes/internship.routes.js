const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Get all internships
router.get('/', async (req, res) => {
    try {
        const [internships] = await pool.query(`
            SELECT i.*, c.company_name, c.industry_sector, c.company_description
            FROM internship_placements_tbl i
            JOIN companies_tbl c ON i.company_id = c.company_id
            WHERE i.placement_status = 'Approved'
        `);

        res.json({
            success: true,
            data: internships
        });
    } catch (error) {
        console.error('Error fetching internships:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching internships'
        });
    }
});

// Get internship by ID
router.get('/:id', async (req, res) => {
    try {
        const [internships] = await pool.query(`
            SELECT i.*, c.company_name, c.industry_sector, c.company_description
            FROM internship_placements_tbl i
            JOIN companies_tbl c ON i.company_id = c.company_id
            WHERE i.placement_id = ?
        `, [req.params.id]);

        if (internships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        res.json({
            success: true,
            data: internships[0]
        });
    } catch (error) {
        console.error('Error fetching internship:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching internship'
        });
    }
});

// Create new internship (Employer only)
router.post('/', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const {
            company_id,
            start_date,
            end_date,
            department,
            supervisor_name,
            supervisor_contact_number,
            supervisor_email,
            placement_remarks
        } = req.body;

        // Validate required fields
        if (!company_id || !start_date || !end_date || !department || !supervisor_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO internship_placements_tbl (
                company_id, start_date, end_date, department,
                supervisor_name, supervisor_contact_number,
                supervisor_email, placement_status, placement_remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'For Review', ?)
        `, [
            company_id, start_date, end_date, department,
            supervisor_name, supervisor_contact_number,
            supervisor_email, placement_remarks
        ]);

        res.status(201).json({
            success: true,
            message: 'Internship created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creating internship:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating internship'
        });
    }
});

// Update internship status (Admin/Faculty only)
router.patch('/:id/status', authMiddleware, roleMiddleware(['Admin', 'Faculty']), async (req, res) => {
    try {
        const { status, remarks } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        await pool.query(`
            UPDATE internship_placements_tbl
            SET placement_status = ?, placement_remarks = ?
            WHERE placement_id = ?
        `, [status, remarks, req.params.id]);

        res.json({
            success: true,
            message: 'Internship status updated successfully'
        });
    } catch (error) {
        console.error('Error updating internship status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating internship status'
        });
    }
});

// Get active internship for current user (for a specific date)
router.get('/active', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today

        // Get active internship for the given date
        const [internships] = await pool.query(`
            SELECT ip.*, c.company_name, c.industry_sector
            FROM internship_placements_tbl ip
            JOIN companies_tbl c ON ip.company_id = c.company_id
            WHERE ip.intern_id = ? 
            AND ip.placement_status = 'Approved'
            AND ip.start_date <= ? 
            AND ip.end_date >= ?
        `, [intern_id, date, date]);

        res.json({
            success: true,
            data: internships
        });
    } catch (error) {
        console.error('Error fetching active internship:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active internship'
        });
    }
});

module.exports = router; 