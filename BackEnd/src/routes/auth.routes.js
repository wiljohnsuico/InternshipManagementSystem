const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateEmail, validatePassword } = require('../utils/validators');

// Login route
router.post('/login', async (req, res) => {
    console.log('Login request received:', req.body);
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        console.log('Attempting database query for email:', email);
        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM users_tbl WHERE email = ?',
            [email]
        );
        console.log('Database query result:', users.length > 0 ? 'User found' : 'No user found');

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        console.log('Verifying password for user:', email);

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isMatch ? 'Match' : 'No match');

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('Generating JWT token');
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.user_id,
                role: user.user_role,
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                role: user.user_role,
                email: user.email
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
        const { email, password, role, first_name, last_name } = req.body;

        // Validate input
        if (!email || !password || !role || !first_name || !last_name) {
            console.log('Missing required fields:', { email, role, first_name, last_name });
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (!validateEmail(email)) {
            console.log('Invalid email format:', email);
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
        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users_tbl WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            console.log('User already exists with email:', email);
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        console.log('Hashing password');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Start transaction
        console.log('Starting database transaction');
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            console.log('Inserting into users_tbl');
            // Insert into users_tbl
            const [result] = await connection.query(
                'INSERT INTO users_tbl (email, password, user_role) VALUES (?, ?, ?)',
                [email, hashedPassword, role]
            );

            const userId = result.insertId;
            console.log('User created with ID:', userId);

            // Insert into role-specific table
            let roleTable = '';
            let roleFields = [];
            let roleValues = [];

            switch (role) {
                case 'Intern':
                    roleTable = 'interns_tbl';
                    roleFields = ['user_id', 'first_name', 'last_name'];
                    roleValues = [userId, first_name, last_name];
                    break;
                case 'Employer':
                    roleTable = 'employers_tbl';
                    roleFields = ['user_id', 'first_name', 'last_name'];
                    roleValues = [userId, first_name, last_name];
                    break;
                case 'Faculty':
                    roleTable = 'faculties_tbl';
                    roleFields = ['user_id', 'first_name', 'last_name'];
                    roleValues = [userId, first_name, last_name];
                    break;
                case 'Admin':
                    roleTable = 'admin_tbl';
                    roleFields = ['user_id', 'first_name', 'last_name'];
                    roleValues = [userId, first_name, last_name];
                    break;
                default:
                    throw new Error('Invalid role');
            }

            console.log('Inserting into role table:', roleTable);
            const query = `INSERT INTO ${roleTable} (${roleFields.join(', ')}) VALUES (${roleFields.map(() => '?').join(', ')})`;
            console.log('Role table query:', query);
            console.log('Role table values:', roleValues);

            await connection.query(query, roleValues);

            await connection.commit();
            connection.release();

            console.log('Signup successful for:', email);
            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        } catch (error) {
            console.error('Transaction error:', error);
            await connection.rollback();
            connection.release();
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