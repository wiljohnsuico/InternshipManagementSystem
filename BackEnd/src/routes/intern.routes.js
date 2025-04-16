const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Ensure resumes table exists
async function ensureResumesTableExists() {
    try {
        // Check if table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'resumes'");
        
        if (tables.length === 0) {
            console.log('Creating resumes table...');
            // Create the table if it doesn't exist
            await db.query(`
                CREATE TABLE resumes (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL UNIQUE,
                    basic JSON DEFAULT '{}',
                    education JSON DEFAULT '[]',
                    skills JSON DEFAULT '[]',
                    image_data MEDIUMTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
                )
            `);
            console.log('Resumes table created successfully');
        } else {
            console.log('Resumes table already exists');
        }
    } catch (error) {
        console.error('Error ensuring resumes table exists:', error);
    }
}

// Call function when module loads
ensureResumesTableExists();

// Get intern profile
router.get('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        console.log('Fetching profile for user:', userId);
        
        // First check if user exists and is an intern
        const [user] = await db.query(
            'SELECT * FROM users_tbl WHERE user_id = ? AND role = "Intern"',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or not an intern'
            });
        }
        
        // Get intern profile
        const [rows] = await db.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.contact_number,
                    i.course, i.age, i.address, i.about, i.skills, i.website
             FROM users_tbl u 
             LEFT JOIN interns_tbl i ON u.user_id = i.user_id 
             WHERE u.user_id = ?`,
            [userId]
        );
        
        const intern = rows[0];
        console.log('Raw intern data:', intern);
        
        if (!intern) {
            // Create intern profile if it doesn't exist
            await db.query(
                'INSERT INTO interns_tbl (user_id, skills) VALUES (?, ?)',
                [userId, '[]']
            );
            
            // Return basic profile
            return res.json({
                success: true,
                data: {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    contact_number: user.contact_number,
                    skills: []
                }
            });
        }
        
        // Parse skills if it's a JSON string
        try {
            intern.skills = intern.skills ? JSON.parse(intern.skills) : [];
            console.log('Parsed skills:', intern.skills);
        } catch (e) {
            console.error('Error parsing skills:', e);
            intern.skills = [];
        }
        
        console.log('Sending profile data:', intern);
        res.json({ 
            success: true, 
            data: intern 
        });
    } catch (error) {
        console.error('Error fetching intern profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message
        });
    }
});

// Update intern profile
router.put('/profile', auth, async (req, res) => {
    let conn;
    try {
        const userId = req.user.user_id;
        console.log('Updating profile for user:', userId);
        console.log('Update data:', req.body);
        
        const {
            first_name,
            last_name,
            course,
            contact_number,
            age,
            address,
            about,
            skills,
            website
        } = req.body;
        
        // Ensure skills is an array and convert to JSON string
        let skillsArray = [];
        if (skills) {
            if (Array.isArray(skills)) {
                skillsArray = skills;
            } else if (typeof skills === 'string') {
                skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
            }
        }
        const skillsJson = JSON.stringify(skillsArray);
        console.log('Skills to save:', skillsJson);
        
        // First check if user exists and is an intern
        const [user] = await db.query(
            'SELECT * FROM users_tbl WHERE user_id = ? AND role = "Intern"',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or not an intern'
            });
        }
        
        // Start transaction
        conn = await db.beginTransaction();
        console.log('Transaction started');
        
        try {
            // Update users_tbl
            console.log('Updating users_tbl...');
            await conn.query(
                `UPDATE users_tbl 
                 SET first_name = ?, last_name = ?, contact_number = ?
                 WHERE user_id = ?`,
                [first_name, last_name, contact_number, userId]
            );
            console.log('users_tbl updated successfully');
            
            // Check if intern profile exists
            console.log('Checking for existing profile...');
            const [existingProfile] = await conn.query(
                'SELECT * FROM interns_tbl WHERE user_id = ?',
                [userId]
            );
            
            if (existingProfile) {
                console.log('Updating existing profile...');
                await conn.query(
                    `UPDATE interns_tbl 
                     SET course = ?, age = ?, address = ?, about = ?, skills = ?, website = ?
                     WHERE user_id = ?`,
                    [course, age, address, about, skillsJson, website, userId]
                );
                console.log('Existing profile updated successfully');
            } else {
                console.log('Creating new profile...');
                await conn.query(
                    `INSERT INTO interns_tbl 
                     (user_id, course, age, address, about, skills, website)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, course, age, address, about, skillsJson, website]
                );
                console.log('New profile created successfully');
            }
            
            // Commit transaction
            console.log('Committing transaction...');
            await conn.commit();
            console.log('Transaction committed successfully');
            
            // Fetch updated profile
            console.log('Fetching updated profile...');
            const [rows] = await db.query(
                `SELECT u.user_id, u.first_name, u.last_name, u.email, u.contact_number,
                        i.course, i.age, i.address, i.about, i.skills, i.website
                 FROM users_tbl u 
                 LEFT JOIN interns_tbl i ON u.user_id = i.user_id 
                 WHERE u.user_id = ?`,
                [userId]
            );
            
            const updatedProfile = rows[0];
            
            // Parse skills from JSON string
            try {
                updatedProfile.skills = updatedProfile.skills ? JSON.parse(updatedProfile.skills) : [];
                console.log('Skills parsed successfully:', updatedProfile.skills);
            } catch (e) {
                console.error('Error parsing skills:', e);
                updatedProfile.skills = [];
            }
            
            console.log('Sending response with updated profile:', updatedProfile);
            res.json({ 
                success: true, 
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            // Rollback transaction on error
            console.error('Error during transaction:', error);
            if (conn) {
                console.log('Rolling back transaction...');
                await conn.rollback();
                console.log('Transaction rolled back');
            }
            throw error;
        } finally {
            // Release connection
            if (conn) {
                console.log('Releasing connection...');
                conn.release();
                console.log('Connection released');
            }
        }
    } catch (error) {
        console.error('Error updating intern profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message
        });
    }
});

// Get resume
router.get('/resume', auth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        console.log('Fetching resume for user:', userId);
        
        // Check if user exists and is an intern
        const [user] = await db.query(
            'SELECT * FROM users_tbl WHERE user_id = ? AND role = "Intern"',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or not an intern'
            });
        }
        
        // Ensure the table exists
        await ensureResumesTableExists();
        
        // Get resume data
        const [rows] = await db.query(
            `SELECT * FROM resumes WHERE user_id = ?`,
            [userId]
        );
        
        if (rows.length === 0) {
            return res.json({
                success: true,
                data: {}
            });
        }
        
        const resume = rows[0];
        
        // Parse JSON fields
        try {
            resume.education = resume.education ? JSON.parse(resume.education) : [];
            resume.skills = resume.skills ? JSON.parse(resume.skills) : [];
            resume.basic = resume.basic ? JSON.parse(resume.basic) : {};
        } catch (e) {
            console.error('Error parsing resume JSON fields:', e);
        }
        
        res.json({
            success: true,
            data: resume
        });
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Save resume
router.post('/resume', auth, async (req, res) => {
    let conn;
    try {
        const userId = req.user.user_id;
        console.log('Saving resume for user:', userId);
        console.log('Resume data:', req.body);
        
        const { basic, education, skills, imageData } = req.body;
        
        // Validate required fields
        if (!basic || !education || !skills) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Check if user exists and is an intern
        const [user] = await db.query(
            'SELECT * FROM users_tbl WHERE user_id = ? AND role = "Intern"',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or not an intern'
            });
        }
        
        // Ensure the table exists
        await ensureResumesTableExists();
        
        // Start transaction
        conn = await db.beginTransaction();
        
        try {
            // Check if resume exists
            const [existing] = await conn.query(
                'SELECT id FROM resumes WHERE user_id = ?',
                [userId]
            );
            
            // Prepare data
            const basicJson = JSON.stringify(basic);
            const educationJson = JSON.stringify(education);
            const skillsJson = JSON.stringify(skills);
            
            if (existing.length > 0) {
                // Update existing resume
                await conn.query(
                    `UPDATE resumes 
                     SET basic = ?, education = ?, skills = ?, image_data = ?, updated_at = NOW()
                     WHERE user_id = ?`,
                    [basicJson, educationJson, skillsJson, imageData, userId]
                );
                console.log('Updated existing resume for user', userId);
            } else {
                // Create new resume
                await conn.query(
                    `INSERT INTO resumes (user_id, basic, education, skills, image_data)
                     VALUES (?, ?, ?, ?, ?)`,
                    [userId, basicJson, educationJson, skillsJson, imageData]
                );
                console.log('Created new resume for user', userId);
            }
            
            // Commit transaction
            await conn.commit();
            
            res.json({
                success: true,
                message: 'Resume saved successfully'
            });
        } catch (error) {
            // Rollback transaction on error
            if (conn) {
                await conn.rollback();
            }
            console.error('Transaction error:', error);
            throw error;
        } finally {
            // Release connection
            if (conn) {
                conn.release();
            }
        }
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router; 