const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Apply for internship (Intern only)
router.post('/', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const { internship_id, resume } = req.body;
        const intern_id = req.user.id;

        // Validate required fields
        if (!internship_id || !resume) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if internship exists and is approved
        const [internships] = await pool.query(
            'SELECT * FROM internship_placements_tbl WHERE placement_id = ? AND placement_status = "Approved"',
            [internship_id]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or not approved'
            });
        }

        // Check if already applied
        const [existingApplications] = await pool.query(
            'SELECT * FROM internship_placements_tbl WHERE intern_id = ? AND company_id = ?',
            [intern_id, internships[0].company_id]
        );

        if (existingApplications.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this internship'
            });
        }

        // Create application
        await pool.query(`
            INSERT INTO internship_placements_tbl (
                intern_id, company_id, start_date, end_date,
                department, supervisor_name, supervisor_contact_number,
                supervisor_email, placement_status, placement_remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        `, [
            intern_id,
            internships[0].company_id,
            internships[0].start_date,
            internships[0].end_date,
            internships[0].department,
            internships[0].supervisor_name,
            internships[0].supervisor_contact_number,
            internships[0].supervisor_email,
            'Application submitted'
        ]);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting application'
        });
    }
});

// Get applications for an employer
router.get('/employer', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const employer_id = req.user.id;

        // Get company ID
        const [employers] = await pool.query(
            'SELECT company_id FROM employers_tbl WHERE employer_id = ?',
            [employer_id]
        );

        if (employers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employer not found'
            });
        }

        const company_id = employers[0].company_id;

        // Get applications
        const [applications] = await pool.query(`
            SELECT ip.*, i.first_name, i.last_name, i.email, i.contact_number,
                   i.year_level, i.section, i.dept, i.skills_qualifications
            FROM internship_placements_tbl ip
            JOIN interns_tbl i ON ip.intern_id = i.intern_id
            WHERE ip.company_id = ? AND ip.placement_status = 'Pending'
        `, [company_id]);

        res.json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications'
        });
    }
});

// Update application status (Employer only)
router.patch('/:id/status', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const application_id = req.params.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Verify employer owns the application
        const [applications] = await pool.query(`
            SELECT ip.* FROM internship_placements_tbl ip
            JOIN employers_tbl e ON ip.company_id = e.company_id
            WHERE ip.placement_id = ? AND e.employer_id = ?
        `, [application_id, req.user.id]);

        if (applications.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this application'
            });
        }

        await pool.query(`
            UPDATE internship_placements_tbl
            SET placement_status = ?, placement_remarks = ?
            WHERE placement_id = ?
        `, [status, remarks, application_id]);

        res.json({
            success: true,
            message: 'Application status updated successfully'
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status'
        });
    }
});

module.exports = router; 