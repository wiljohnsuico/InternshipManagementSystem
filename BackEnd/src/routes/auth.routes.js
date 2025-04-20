const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateEmail, validatePassword } = require('../utils/validators');

// Login route - Add detailed logging to debug the login issue
router.post('/login', async (req, res) => {
    console.log('Login request received:', {
        ...req.body,
        password: req.body.password ? '[REDACTED]' : undefined
    });
    
    try {
        // Extract login credentials
        // Note: Frontend might still send 'username' even though we use 'email' in the database
        const { username, password, email } = req.body;
        
        // Use either provided email or username as the email field
        const loginEmail = email || username;

        // Validate input
        if (!loginEmail || !password) {
            console.log('Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        console.log('Attempting database query for email:', loginEmail);
        
        // Query to find user by email (there's no username field in the database)
        // Use LOWER() for case-insensitive email comparison
        const [users] = await pool.query(
            'SELECT * FROM users_tbl WHERE LOWER(email) = LOWER(?)',
            [loginEmail]
        );
        
        console.log('Database query result:', users.length > 0 ? {
            found: true,
            user_id: users[0].user_id,
            email: users[0].email,
            role: users[0].role
        } : 'No user found');

        if (users.length === 0) {
            console.log('No user found with email:', loginEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        console.log('Found user:', { 
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            password_length: user.password ? user.password.length : 0
        });

        // Verify password with detailed logging
        console.log('Comparing provided password with stored hash');
        console.log('Stored hash format check:', {
            starts_with_dollar: user.password.startsWith('$'),
            contains_bcrypt: user.password.includes('$2'),
            length: user.password.length
        });
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isMatch ? 'Match' : 'No match');

        if (!isMatch) {
            console.log('Password does not match for user:', user.email);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('Generating JWT token');
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user.email, 'with role:', user.role);
        res.json({
            success: true,
            token,
            user: {
                user_id: user.user_id,
                role: user.role,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    try {
        const { email, password, role, first_name, last_name, student_id } = req.body;

        if (!email || !password || !role || !first_name || !last_name) {
            console.log('Missing required fields:', { email, role, first_name, last_name });
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (role === 'Intern' && !student_id) {
            console.log('Missing student ID for intern signup');
            return res.status(400).json({
                success: false,
                message: 'Student ID is required for intern signup'
            });
        }

        if (!validateEmail(email)) {
            console.log('Invalid email format provided:', email);
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (!validatePassword(password)) {
            console.log('Invalid password format');
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        console.log('Checking for existing user with email:', email);
        const [existingUsers] = await pool.query(
            'SELECT * FROM users_tbl WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            console.log('User already exists with email:', email);
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Check for duplicate student ID if role is Intern
        if (role === 'Intern' && student_id) {
            console.log('Checking for existing student with ID:', student_id);
            const [existingStudents] = await pool.query(
                'SELECT * FROM interns_tbl WHERE student_id = ?',
                [student_id]
            );

            if (existingStudents.length > 0) {
                console.log('Student ID already exists:', student_id);
                return res.status(400).json({
                    success: false,
                    message: 'Student ID already exists. Please use a different ID.'
                });
            }
        }

        console.log('Hashing password');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('Starting database transaction');
        await pool.query('START TRANSACTION');

        try {
            console.log('Inserting into users_tbl');
            const [result] = await pool.query(
                'INSERT INTO users_tbl (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                [first_name, last_name, email, hashedPassword, role]
            );

            const userId = result.insertId;
            console.log('User created with ID:', userId);

            let roleTable = '';
            let roleFields = ['user_id'];
            let roleValues = [userId];

            switch (role) {
                case 'Intern':
                    roleTable = 'interns_tbl';
                    if (student_id) {
                        roleFields.push('student_id');
                        roleValues.push(student_id);
                    }
                    break;
                case 'Employer':
                    roleTable = 'employers_tbl';
                    break;
                case 'Faculty':
                    roleTable = 'faculties_tbl';
                    break;
                case 'Admin':
                    roleTable = 'admin_tbl';
                    break;
                default:
                    throw new Error('Invalid role');
            }

            console.log('Inserting into role table:', roleTable);
            const query = `INSERT INTO ${roleTable} (${roleFields.join(', ')}) VALUES (${roleFields.map(() => '?').join(', ')})`;
            console.log('Role table query:', query);
            console.log('Role table values:', roleValues);

            await pool.query(query, roleValues);

            await pool.query('COMMIT');

            console.log('Signup successful for:', email);
            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        } catch (error) {
            console.error('Transaction error:', error);
            await pool.query('ROLLBACK');
            
            // Handle specific error cases with more user-friendly messages
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.sqlMessage.includes('student_id')) {
                    return res.status(400).json({
                        success: false,
                        message: 'Student ID already exists. Please use a different ID.'
                    });
                } else if (error.sqlMessage.includes('email')) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists. Please use a different email.'
                    });
                }
            }
            
            throw error;
        }
    } catch (error) {
        console.error('Signup error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Server error during signup',
            error: error.message
        });
    }
});

module.exports = router;
