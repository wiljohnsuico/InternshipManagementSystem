const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Get all weekly reports for logged-in intern
router.get('/weekly', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        
        const [reports] = await pool.query(`
            SELECT wr.*, c.company_name
            FROM weekly_report_tbl wr
            JOIN companies_tbl c ON wr.company_id = c.company_id
            WHERE wr.intern_id = ?
            ORDER BY wr.week_start_date DESC
        `, [intern_id]);
        
        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching weekly reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching weekly reports'
        });
    }
});

// Create or update weekly report
router.post('/weekly', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        const { 
            report_id,
            week_start_date, 
            week_end_date, 
            summary, 
            key_learnings,
            goals_achieved,
            next_week_goals,
            status
        } = req.body;
        
        // Validate required fields
        if (!week_start_date || !week_end_date || !summary || !key_learnings) {
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
        `, [intern_id, week_start_date, week_end_date]);
        
        if (internships.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active internship found for this time period'
            });
        }
        
        const company_id = internships[0].company_id;
        
        // Check if updating existing report or creating new one
        if (report_id) {
            // Verify ownership before updating
            const [existing] = await pool.query(
                'SELECT * FROM weekly_report_tbl WHERE report_id = ? AND intern_id = ?',
                [report_id, intern_id]
            );
            
            if (existing.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this report'
                });
            }
            
            // Can only update if not already approved
            if (existing[0].status === 'Faculty Approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update an approved report'
                });
            }
            
            // Update existing report
            await pool.query(`
                UPDATE weekly_report_tbl SET
                week_start_date = ?,
                week_end_date = ?,
                summary = ?,
                key_learnings = ?,
                goals_achieved = ?,
                next_week_goals = ?,
                status = ?
                WHERE report_id = ? AND intern_id = ?
            `, [
                week_start_date, 
                week_end_date, 
                summary, 
                key_learnings,
                goals_achieved || '',
                next_week_goals || '',
                status || 'Draft',
                report_id,
                intern_id
            ]);
            
            res.json({
                success: true,
                message: 'Weekly report updated successfully',
                report_id: report_id
            });
        } else {
            // Create new report
            const [result] = await pool.query(`
                INSERT INTO weekly_report_tbl (
                    intern_id,
                    company_id,
                    week_start_date,
                    week_end_date,
                    summary,
                    key_learnings,
                    goals_achieved,
                    next_week_goals,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                intern_id,
                company_id,
                week_start_date,
                week_end_date,
                summary,
                key_learnings,
                goals_achieved || '',
                next_week_goals || '',
                status || 'Draft'
            ]);
            
            res.status(201).json({
                success: true,
                message: 'Weekly report created successfully',
                report_id: result.insertId
            });
        }
    } catch (error) {
        console.error('Error saving weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving weekly report'
        });
    }
});

// Get specific weekly report
router.get('/weekly/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const role = req.user.role;
        
        let query = `
            SELECT wr.*, c.company_name, 
                   CONCAT(u.first_name, ' ', u.last_name) as intern_name
            FROM weekly_report_tbl wr
            JOIN companies_tbl c ON wr.company_id = c.company_id
            JOIN interns_tbl i ON wr.intern_id = i.id
            JOIN users_tbl u ON i.user_id = u.user_id
            WHERE wr.report_id = ?
        `;
        
        // Add role-specific conditions
        if (role === 'Intern') {
            // Interns can only view their own reports
            query += ' AND i.user_id = ?';
            var [report] = await pool.query(query, [id, user_id]);
        } else if (role === 'Employer') {
            // Employers can only view reports from their company
            query += ' AND wr.company_id = (SELECT company_id FROM employers_tbl WHERE user_id = ?)';
            var [report] = await pool.query(query, [id, user_id]);
        } else if (role === 'Faculty' || role === 'Admin') {
            // Faculty and admin can view all reports
            var [report] = await pool.query(query, [id]);
        }
        
        if (!report || report.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found or you do not have permission to view it'
            });
        }
        
        res.json({
            success: true,
            data: report[0]
        });
    } catch (error) {
        console.error('Error fetching weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching weekly report'
        });
    }
});

// Submit weekly report
router.post('/weekly/:id/submit', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const { id } = req.params;
        const intern_id = req.user.id;
        
        // Verify ownership before updating
        const [existing] = await pool.query(
            'SELECT * FROM weekly_report_tbl WHERE report_id = ? AND intern_id = ?',
            [id, intern_id]
        );
        
        if (existing.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to submit this report'
            });
        }
        
        // Update status to submitted
        await pool.query(
            'UPDATE weekly_report_tbl SET status = "Submitted" WHERE report_id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Weekly report submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting weekly report'
        });
    }
});

// Supervisor approves weekly report
router.post('/weekly/:id/supervisor-approve', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const employer_id = req.user.id;
        
        // Verify employer has authority to approve this report
        const [hasAuthority] = await pool.query(`
            SELECT 1 FROM weekly_report_tbl wr
            JOIN companies_tbl c ON wr.company_id = c.company_id
            JOIN employers_tbl e ON c.company_id = e.company_id
            WHERE wr.report_id = ? AND e.user_id = ?
        `, [id, employer_id]);
        
        if (hasAuthority.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this report'
            });
        }
        
        // Update report with supervisor approval
        await pool.query(`
            UPDATE weekly_report_tbl 
            SET supervisor_feedback = ?,
                supervisor_approved = TRUE,
                status = 'Supervisor Approved'
            WHERE report_id = ?
        `, [feedback || '', id]);
        
        res.json({
            success: true,
            message: 'Weekly report approved by supervisor'
        });
    } catch (error) {
        console.error('Error approving weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving weekly report'
        });
    }
});

// Faculty approves weekly report
router.post('/weekly/:id/faculty-approve', authMiddleware, roleMiddleware(['Faculty']), async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        
        // Update report with faculty approval
        await pool.query(`
            UPDATE weekly_report_tbl 
            SET faculty_feedback = ?,
                faculty_approved = TRUE,
                status = 'Faculty Approved'
            WHERE report_id = ?
        `, [feedback || '', id]);
        
        res.json({
            success: true,
            message: 'Weekly report approved by faculty'
        });
    } catch (error) {
        console.error('Error faculty approving weekly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error faculty approving weekly report'
        });
    }
});

// Request revision for weekly report
router.post('/weekly/:id/request-revision', authMiddleware, roleMiddleware(['Employer', 'Faculty']), async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback, role } = req.body;
        
        if (role === 'Employer') {
            await pool.query(`
                UPDATE weekly_report_tbl 
                SET supervisor_feedback = ?,
                    status = 'Needs Revision'
                WHERE report_id = ?
            `, [feedback || 'Please revise this report', id]);
        } else {
            await pool.query(`
                UPDATE weekly_report_tbl 
                SET faculty_feedback = ?,
                    status = 'Needs Revision'
                WHERE report_id = ?
            `, [feedback || 'Please revise this report', id]);
        }
        
        res.json({
            success: true,
            message: 'Revision requested for weekly report'
        });
    } catch (error) {
        console.error('Error requesting revision:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting revision'
        });
    }
});

// MONTHLY REPORTS

// Get all monthly reports for logged-in intern
router.get('/monthly', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        
        const [reports] = await pool.query(`
            SELECT mr.*, c.company_name
            FROM monthly_report_tbl mr
            JOIN companies_tbl c ON mr.company_id = c.company_id
            WHERE mr.intern_id = ?
            ORDER BY mr.year DESC, mr.month DESC
        `, [intern_id]);
        
        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching monthly reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly reports'
        });
    }
});

// Create or update monthly report
router.post('/monthly', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const intern_id = req.user.id;
        const { 
            report_id,
            month,
            year, 
            summary, 
            projects_completed,
            major_achievements,
            challenges,
            skills_developed,
            overall_experience,
            status
        } = req.body;
        
        // Validate required fields
        if (!month || !year || !summary || !projects_completed || !major_achievements || !challenges || !skills_developed) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Calculate start and end date of month for internship check
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        // Get company ID from active internship
        const [internships] = await pool.query(`
            SELECT company_id FROM internship_placements_tbl
            WHERE intern_id = ? AND placement_status = 'Approved'
            AND start_date <= ? AND end_date >= ?
        `, [
            intern_id, 
            endDate.toISOString().split('T')[0], 
            startDate.toISOString().split('T')[0]
        ]);
        
        if (internships.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active internship found for this month'
            });
        }
        
        const company_id = internships[0].company_id;
        
        // Check if updating existing report or creating new one
        if (report_id) {
            // Verify ownership before updating
            const [existing] = await pool.query(
                'SELECT * FROM monthly_report_tbl WHERE report_id = ? AND intern_id = ?',
                [report_id, intern_id]
            );
            
            if (existing.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to update this report'
                });
            }
            
            // Can only update if not already approved
            if (existing[0].status === 'Faculty Approved') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot update an approved report'
                });
            }
            
            // Update existing report
            await pool.query(`
                UPDATE monthly_report_tbl SET
                month = ?,
                year = ?,
                summary = ?,
                projects_completed = ?,
                major_achievements = ?,
                challenges = ?,
                skills_developed = ?,
                overall_experience = ?,
                status = ?
                WHERE report_id = ? AND intern_id = ?
            `, [
                month,
                year, 
                summary, 
                projects_completed,
                major_achievements,
                challenges,
                skills_developed,
                overall_experience || '',
                status || 'Draft',
                report_id,
                intern_id
            ]);
            
            res.json({
                success: true,
                message: 'Monthly report updated successfully',
                report_id: report_id
            });
        } else {
            // Create new report
            const [result] = await pool.query(`
                INSERT INTO monthly_report_tbl (
                    intern_id,
                    company_id,
                    month,
                    year,
                    summary,
                    projects_completed,
                    major_achievements,
                    challenges,
                    skills_developed,
                    overall_experience,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                intern_id,
                company_id,
                month,
                year,
                summary,
                projects_completed,
                major_achievements,
                challenges,
                skills_developed,
                overall_experience || '',
                status || 'Draft'
            ]);
            
            res.status(201).json({
                success: true,
                message: 'Monthly report created successfully',
                report_id: result.insertId
            });
        }
    } catch (error) {
        console.error('Error saving monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving monthly report'
        });
    }
});

// Additional routes for monthly reports (similar pattern to weekly reports)
// Get specific monthly report
router.get('/monthly/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const role = req.user.role;
        
        let query = `
            SELECT mr.*, c.company_name, 
                   CONCAT(u.first_name, ' ', u.last_name) as intern_name
            FROM monthly_report_tbl mr
            JOIN companies_tbl c ON mr.company_id = c.company_id
            JOIN interns_tbl i ON mr.intern_id = i.id
            JOIN users_tbl u ON i.user_id = u.user_id
            WHERE mr.report_id = ?
        `;
        
        // Add role-specific conditions
        if (role === 'Intern') {
            // Interns can only view their own reports
            query += ' AND i.user_id = ?';
            var [report] = await pool.query(query, [id, user_id]);
        } else if (role === 'Employer') {
            // Employers can only view reports from their company
            query += ' AND mr.company_id = (SELECT company_id FROM employers_tbl WHERE user_id = ?)';
            var [report] = await pool.query(query, [id, user_id]);
        } else if (role === 'Faculty' || role === 'Admin') {
            // Faculty and admin can view all reports
            var [report] = await pool.query(query, [id]);
        }
        
        if (!report || report.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found or you do not have permission to view it'
            });
        }
        
        res.json({
            success: true,
            data: report[0]
        });
    } catch (error) {
        console.error('Error fetching monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly report'
        });
    }
});

// Submit monthly report
router.post('/monthly/:id/submit', authMiddleware, roleMiddleware(['Intern']), async (req, res) => {
    try {
        const { id } = req.params;
        const intern_id = req.user.id;
        
        // Verify ownership before updating
        const [existing] = await pool.query(
            'SELECT * FROM monthly_report_tbl WHERE report_id = ? AND intern_id = ?',
            [id, intern_id]
        );
        
        if (existing.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to submit this report'
            });
        }
        
        // Update status to submitted
        await pool.query(
            'UPDATE monthly_report_tbl SET status = "Submitted" WHERE report_id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Monthly report submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting monthly report'
        });
    }
});

// Supervisor approves monthly report
router.post('/monthly/:id/supervisor-approve', authMiddleware, roleMiddleware(['Employer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        const employer_id = req.user.id;
        
        // Verify employer has authority to approve this report
        const [hasAuthority] = await pool.query(`
            SELECT 1 FROM monthly_report_tbl mr
            JOIN companies_tbl c ON mr.company_id = c.company_id
            JOIN employers_tbl e ON c.company_id = e.company_id
            WHERE mr.report_id = ? AND e.user_id = ?
        `, [id, employer_id]);
        
        if (hasAuthority.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this report'
            });
        }
        
        // Update report with supervisor approval
        await pool.query(`
            UPDATE monthly_report_tbl 
            SET supervisor_feedback = ?,
                supervisor_approved = TRUE,
                status = 'Supervisor Approved'
            WHERE report_id = ?
        `, [feedback || '', id]);
        
        res.json({
            success: true,
            message: 'Monthly report approved by supervisor'
        });
    } catch (error) {
        console.error('Error approving monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving monthly report'
        });
    }
});

// Faculty approves monthly report
router.post('/monthly/:id/faculty-approve', authMiddleware, roleMiddleware(['Faculty']), async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        
        // Update report with faculty approval
        await pool.query(`
            UPDATE monthly_report_tbl 
            SET faculty_feedback = ?,
                faculty_approved = TRUE,
                status = 'Faculty Approved'
            WHERE report_id = ?
        `, [feedback || '', id]);
        
        res.json({
            success: true,
            message: 'Monthly report approved by faculty'
        });
    } catch (error) {
        console.error('Error faculty approving monthly report:', error);
        res.status(500).json({
            success: false,
            message: 'Error faculty approving monthly report'
        });
    }
});

module.exports = router; 