const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { validateEmail, validatePhoneNumber, validateName } = require('../utils/validators');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let profile;
        switch (role) {
            case 'Intern':
                [profile] = await pool.query(`
                    SELECT * FROM interns_tbl 
                    WHERE user_id = ?
                `, [userId]);
                break;
            case 'Employer':
                [profile] = await pool.query(`
                    SELECT e.*, c.company_name, c.industry_sector, c.company_description
                    FROM employers_tbl e
                    LEFT JOIN companies_tbl c ON e.company_id = c.company_id
                    WHERE e.user_id = ?
                `, [userId]);
                break;
            case 'Faculty':
                [profile] = await pool.query(`
                    SELECT * FROM faculties_tbl 
                    WHERE user_id = ?
                `, [userId]);
                break;
            case 'Admin':
                [profile] = await pool.query(`
                    SELECT * FROM admin_tbl 
                    WHERE user_id = ?
                `, [userId]);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            data: profile[0]
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const updates = req.body;

        // Validate input fields
        if (updates.email && !validateEmail(updates.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (updates.contact_number && !validatePhoneNumber(updates.contact_number)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        if ((updates.first_name || updates.last_name) && 
            (!validateName(updates.first_name) || !validateName(updates.last_name))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid name format'
            });
        }

        let tableName;
        switch (role) {
            case 'Intern':
                tableName = 'interns_tbl';
                break;
            case 'Employer':
                tableName = 'employers_tbl';
                break;
            case 'Faculty':
                tableName = 'faculties_tbl';
                break;
            case 'Admin':
                tableName = 'admin_tbl';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];
        Object.keys(updates).forEach(key => {
            if (key !== 'user_id' && key !== 'role') {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(userId);

        const query = `
            UPDATE ${tableName}
            SET ${updateFields.join(', ')}
            WHERE user_id = ?
        `;

        await pool.query(query, updateValues);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both current and new password'
            });
        }

        // Get current password hash
        const [users] = await pool.query(
            'SELECT password FROM users_tbl WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query(
            'UPDATE users_tbl SET password = ? WHERE user_id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

module.exports = router; 