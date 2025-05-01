const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Admin controller to handle admin operations
 */
const adminController = {
    /**
     * Admin authentication and account management
     */
     
    // API status check endpoint for server discovery
    apiStatus: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                message: 'API server is running',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in API status check:', error);
            res.status(500).json({
                success: false,
                message: 'API server error',
                error: error.message
            });
        }
    },

    /**
     * Get all interns
     */
    getAllInterns: async (req, res) => {
        try {
            const [interns] = await pool.query(`
                SELECT i.*, u.first_name, u.last_name, u.email, u.role 
                FROM interns_tbl i
                JOIN users_tbl u ON i.user_id = u.user_id
                WHERE u.is_deleted = 0
                ORDER BY u.last_name, u.first_name
            `);
            
            res.json({
                success: true,
                interns
            });
        } catch (error) {
            console.error('Error fetching interns:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching interns',
                error: error.message
            });
        }
    },

    /**
     * Update intern status
     */
    updateInternStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }
            
            // Update intern status
            const [result] = await pool.query(
                'UPDATE interns_tbl SET verification_status = ? WHERE id = ?',
                [status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intern not found or no change made'
                });
            }
            
            res.json({
                success: true,
                message: 'Intern status updated successfully'
            });
        } catch (error) {
            console.error('Error updating intern status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating intern status'
            });
        }
    },

    /**
     * Update intern details
     */
    updateIntern: async (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, college_department, course } = req.body;
            
            await pool.query('START TRANSACTION');
            
            // Get the user_id from the intern record
            const [interns] = await pool.query(
                'SELECT user_id FROM interns_tbl WHERE intern_id = ?',
                [id]
            );
            
            if (interns.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Intern not found'
                });
            }
            
            const userId = interns[0].user_id;
            
            // Update the user record
            await pool.query(
                'UPDATE users_tbl SET first_name = ?, last_name = ? WHERE user_id = ?',
                [first_name, last_name, userId]
            );
            
            // Update the intern record
            await pool.query(
                'UPDATE interns_tbl SET department = ?, course = ? WHERE intern_id = ?',
                [college_department, course, id]
            );
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Intern updated successfully'
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error updating intern:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating intern',
                error: error.message
            });
        }
    },

    /**
     * Delete an intern (soft delete)
     */
    deleteIntern: async (req, res) => {
        try {
            const { id } = req.params;
            
            await pool.query('START TRANSACTION');
            
            // Get the user_id from the intern record
            const [interns] = await pool.query(
                'SELECT user_id FROM interns_tbl WHERE intern_id = ?',
                [id]
            );
            
            if (interns.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Intern not found'
                });
            }
            
            const userId = interns[0].user_id;
            
            // Archive the intern (optional step to keep a record)
            const [internDetails] = await pool.query(`
                SELECT i.*, u.first_name, u.last_name, u.email 
                FROM interns_tbl i
                JOIN users_tbl u ON i.user_id = u.user_id
                WHERE i.intern_id = ?
            `, [id]);
            
            if (internDetails.length > 0) {
                const intern = internDetails[0];
                
                // Insert into archive table
                await pool.query(`
                    INSERT INTO archived_interns_tbl (
                        original_intern_id, user_id, student_id, department, course, 
                        first_name, last_name, email, archived_by, archived_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    id, userId, intern.student_id, intern.department, intern.course,
                    intern.first_name, intern.last_name, intern.email, req.user.user_id
                ]);
            }
            
            // Soft delete the user record
            await pool.query(
                'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                [userId]
            );
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Intern deleted and archived successfully'
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error deleting intern:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting intern',
                error: error.message
            });
        }
    },

    /**
     * Get all archived interns
     */
    getArchivedInterns: async (req, res) => {
        try {
            console.log('Fetching archived interns...');
            
            // Check if the archived_interns_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_interns_tbl"');
            
            if (tables.length === 0) {
                console.log('The archived_interns_tbl does not exist yet');
                return res.json({
                    success: true,
                    archivedInterns: []
                });
            }
            
            // Fetch the archived interns
            const [archivedInterns] = await pool.query(`
                SELECT * FROM archived_interns_tbl
                ORDER BY archived_date DESC
            `);
            
            console.log(`Found ${archivedInterns.length} archived interns`);
            
            return res.json({
                success: true,
                archivedInterns
            });
        } catch (error) {
            console.error('Error fetching archived interns:', error.message);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Error fetching archived interns',
                error: error.message
            });
        }
    },

    /**
     * Get all faculty members
     */
    getAllFaculty: async (req, res) => {
        try {
            console.log('Fetching all faculty members');
            
            // Find the primary key column for faculties_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM faculties_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            // Get the column structure to check for department vs dept
            const [columns] = await pool.query('SHOW COLUMNS FROM faculties_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Faculty table columns:', columnNames);
            
            // Determine if we should use department or dept in the query
            const departmentColumn = columnNames.includes('department') 
                ? 'f.department' 
                : (columnNames.includes('dept') ? 'f.dept' : 'NULL');
            console.log('Using department column:', departmentColumn);
            
            // Build the query to get all faculties with proper field names
            const query = `
                SELECT f.${primaryKeyColumn} as id, 
                       u.first_name, 
                       u.last_name, 
                       u.email, 
                       u.role, 
                       ${departmentColumn} as department
                FROM faculties_tbl f
                JOIN users_tbl u ON f.user_id = u.user_id
                WHERE u.is_deleted = 0
                ORDER BY u.last_name, u.first_name
            `;
            console.log('Executing query:', query);
            
            const [faculty] = await pool.query(query);
            console.log(`Found ${faculty.length} faculty members`);
            
            res.json({
                success: true,
                faculty
            });
        } catch (error) {
            console.error('Error fetching faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Create faculty member
     */
    createFaculty: async (req, res) => {
        try {
            console.log('Create faculty request received:', {
                ...req.body,
                password: req.body.password ? '[REDACTED]' : undefined
            });
            
            const { first_name, last_name, email, password, department } = req.body;
            
            // Validate input
            if (!first_name || !last_name || !email || !password) {
                console.log('Missing required fields:', { first_name, last_name, email, password: !!password });
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields'
                });
            }
            
            // Check if email already exists
            console.log('Checking if email exists:', email);
            const [existingUsers] = await pool.query(
                'SELECT * FROM users_tbl WHERE email = ? AND is_deleted = 0',
                [email]
            );
            
            if (existingUsers.length > 0) {
                console.log('User already exists with email:', email);
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }
            
            // Hash password
            console.log('Hashing password');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            console.log('Starting transaction');
            await pool.query('START TRANSACTION');
            
            try {
                // Insert user record
                console.log('Inserting user record');
                const [userResult] = await pool.query(
                    'INSERT INTO users_tbl (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                    [first_name, last_name, email, hashedPassword, 'Faculty']
                );
                
                const userId = userResult.insertId;
                console.log('User created with ID:', userId);
                
                // Try to get the structure of faculties_tbl to check column names
                console.log('Checking faculties_tbl structure');
                const [columns] = await pool.query('SHOW COLUMNS FROM faculties_tbl');
                const columnNames = columns.map(col => col.Field);
                console.log('Faculties_tbl columns:', columnNames);
                
                // Determine if we should use 'department' or 'dept' based on table structure
                const hasDepartmentColumn = columnNames.includes('department');
                const hasDeptColumn = columnNames.includes('dept');
                
                let insertQuery = '';
                let insertParams = [];
                
                if (hasDepartmentColumn) {
                    console.log('Using department column');
                    insertQuery = 'INSERT INTO faculties_tbl (user_id, department) VALUES (?, ?)';
                    insertParams = [userId, department || ''];
                } else if (hasDeptColumn) {
                    console.log('Using dept column');
                    insertQuery = 'INSERT INTO faculties_tbl (user_id, dept) VALUES (?, ?)';
                    insertParams = [userId, department || ''];
                } else {
                    // If neither column exists, just insert the user_id
                    console.log('No department/dept column found, using minimal insert');
                    insertQuery = 'INSERT INTO faculties_tbl (user_id) VALUES (?)';
                    insertParams = [userId];
                }
                
                // Insert faculty record
                console.log('Inserting faculty record with query:', insertQuery);
                const [facultyResult] = await pool.query(insertQuery, insertParams);
                
                console.log('Faculty record created with ID:', facultyResult.insertId);
                await pool.query('COMMIT');
                
                res.status(201).json({
                    success: true,
                    message: 'Faculty created successfully',
                    facultyId: facultyResult.insertId
                });
            } catch (error) {
                console.error('Error in transaction:', error);
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error creating faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Update faculty
     */
    updateFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, department } = req.body;
            
            console.log('Update faculty request received:', { id, first_name, last_name, department });
            
            if (!id || id === 'undefined') {
                console.error('Invalid faculty ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid faculty ID provided'
                });
            }
            
            await pool.query('START TRANSACTION');
            
            // Check table structure to determine column names
            console.log('Checking faculties_tbl structure');
            const [columns] = await pool.query('SHOW COLUMNS FROM faculties_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Faculties_tbl columns:', columnNames);
            
            // Find the primary key column
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM faculties_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : null;
            console.log('Primary key column:', primaryKeyColumn);
            
            if (!primaryKeyColumn) {
                await pool.query('ROLLBACK');
                console.error('Could not determine primary key for faculties_tbl');
                return res.status(500).json({
                    success: false,
                    message: 'Database schema error: No primary key found in faculties_tbl'
                });
            }
            
            // Get the user_id from the faculty record using the identified primary key
            const query = `SELECT user_id FROM faculties_tbl WHERE ${primaryKeyColumn} = ?`;
            console.log('Executing query:', query, 'with param:', id);
            
            const [faculty] = await pool.query(query, [id]);
            
            if (faculty.length === 0) {
                console.log('Faculty not found with ID:', id);
                await pool.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Faculty not found'
                });
            }
            
            const userId = faculty[0].user_id;
            console.log('Faculty user_id found:', userId);
            
            // Update the user record
            console.log('Updating user record');
            await pool.query(
                'UPDATE users_tbl SET first_name = ?, last_name = ? WHERE user_id = ?',
                [first_name, last_name, userId]
            );
            
            // Update based on column name
            if (columnNames.includes('department')) {
                console.log('Updating department column');
                await pool.query(
                    `UPDATE faculties_tbl SET department = ? WHERE ${primaryKeyColumn} = ?`,
                    [department, id]
                );
            } else if (columnNames.includes('dept')) {
                console.log('Updating dept column');
                await pool.query(
                    `UPDATE faculties_tbl SET dept = ? WHERE ${primaryKeyColumn} = ?`,
                    [department, id]
                );
            } else {
                console.log('No department/dept column found, skipping that update');
            }
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Faculty updated successfully'
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error updating faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Delete faculty (soft delete)
     */
    deleteFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Delete faculty request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid faculty ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid faculty ID provided'
                });
            }
            
            await pool.query('START TRANSACTION');
            
            // Check table structure to determine column names
            console.log('Checking faculties_tbl structure');
            const [columns] = await pool.query('SHOW COLUMNS FROM faculties_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Faculties_tbl columns:', columnNames);
            
            // Find the primary key column
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM faculties_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : null;
            console.log('Primary key column:', primaryKeyColumn);
            
            if (!primaryKeyColumn) {
                await pool.query('ROLLBACK');
                console.error('Could not determine primary key for faculties_tbl');
                return res.status(500).json({
                    success: false,
                    message: 'Database schema error: No primary key found in faculties_tbl'
                });
            }
            
            // Get the user_id from the faculty record using the identified primary key
            const query = `SELECT user_id FROM faculties_tbl WHERE ${primaryKeyColumn} = ?`;
            console.log('Executing query:', query, 'with param:', id);
            
            const [faculty] = await pool.query(query, [id]);
            
            if (faculty.length === 0) {
                await pool.query('ROLLBACK');
                console.error('Faculty not found with ID:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Faculty not found'
                });
            }
            
            const userId = faculty[0].user_id;
            console.log('Found faculty with user_id:', userId);
            
            // Soft delete the user record
            console.log('Soft deleting user record');
            await pool.query(
                'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                [userId]
            );
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Faculty deleted successfully'
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error deleting faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Archive faculty member (soft delete)
     */
    archiveFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('Archive faculty request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid faculty ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid faculty ID provided'
                });
            }
            
            // Find the primary key column for faculties_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM faculties_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            await pool.query('START TRANSACTION');
            
            try {
                // Check if archived_faculties_tbl exists and create it if it doesn't
                const [tables] = await pool.query('SHOW TABLES LIKE "archived_faculties_tbl"');
                
                if (tables.length === 0) {
                    console.log('Creating archived_faculties_tbl as it does not exist');
                    
                    await pool.query(`
                        CREATE TABLE archived_faculties_tbl (
                            archive_id INT AUTO_INCREMENT PRIMARY KEY,
                            original_faculty_id INT NOT NULL,
                            user_id INT NOT NULL,
                            department VARCHAR(255),
                            first_name VARCHAR(255) NOT NULL,
                            last_name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            archived_by INT NOT NULL,
                            archived_date DATETIME NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    
                    console.log('archived_faculties_tbl created successfully');
                }
                
                // Get the faculty details before archiving
                const [facultyDetails] = await pool.query(`
                    SELECT f.*, u.first_name, u.last_name, u.email 
                    FROM faculties_tbl f
                    JOIN users_tbl u ON f.user_id = u.user_id
                    WHERE f.${primaryKeyColumn} = ?
                `, [id]);
                
                if (facultyDetails.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Faculty not found'
                    });
                }
                
                const faculty = facultyDetails[0];
                const userId = faculty.user_id;
                
                // Insert into archived_faculties_tbl
                await pool.query(`
                    INSERT INTO archived_faculties_tbl (
                        original_faculty_id, user_id, department, 
                        first_name, last_name, email, archived_by, archived_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    id, userId, faculty.department || faculty.dept || null,
                    faculty.first_name, faculty.last_name, faculty.email, req.user.user_id
                ]);
                
                // Soft delete the user record
                await pool.query(
                    'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                    [userId]
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Faculty archived successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error archiving faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error archiving faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Get all employers
     */
    getAllEmployers: async (req, res) => {
        try {
            console.log('Fetching all employers');
            
            // Find the primary key column for employers_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'employer_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            // Get the column structure to check for available columns
            const [columns] = await pool.query('SHOW COLUMNS FROM employers_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Employers table columns:', columnNames);
            
            // Find the company foreign key column
            const companyFKName = columnNames.includes('company_id') ? 'company_id' : null;
            console.log('Company foreign key column:', companyFKName);
            
            // Find the primary key column for companies_tbl if we have a company foreign key
            let companyPrimaryKeyColumn = null;
            let companyColumns = [];
            if (companyFKName) {
                const [companyPKInfo] = await pool.query('SHOW KEYS FROM companies_tbl WHERE Key_name = "PRIMARY"');
                companyPrimaryKeyColumn = companyPKInfo.length > 0 ? companyPKInfo[0].Column_name : 'company_id';
                
                const [compCols] = await pool.query('SHOW COLUMNS FROM companies_tbl');
                companyColumns = compCols.map(col => col.Field);
                console.log('Companies table columns:', companyColumns);
            }
            
            // Build the SELECT clause
            const selectFields = [`e.${primaryKeyColumn} as id`];
            
            // Add fields from users_tbl
            selectFields.push('u.first_name', 'u.last_name', 'u.email', 'u.role');
            
            // Add position field if it exists
            if (columnNames.includes('position')) {
                selectFields.push('e.position');
            }
            
            // Add company name if company relation exists
            if (companyFKName && companyPrimaryKeyColumn && companyColumns.includes('company_name')) {
                selectFields.push('c.company_name');
            }
            
            // Build the JOIN clause for companies
            const companyJoin = (companyFKName && companyPrimaryKeyColumn) 
                ? `LEFT JOIN companies_tbl c ON e.${companyFKName} = c.${companyPrimaryKeyColumn}` 
                : '';
            
            const query = `
                SELECT ${selectFields.join(', ')}
                FROM employers_tbl e
                JOIN users_tbl u ON e.user_id = u.user_id
                ${companyJoin}
                WHERE u.is_deleted = 0
                ORDER BY u.last_name, u.first_name
            `;
            console.log('Executing query:', query);
            
            const [employers] = await pool.query(query);
            console.log(`Found ${employers.length} employers`);
            
            res.json({
                success: true,
                employers
            });
        } catch (error) {
            console.error('Error fetching employers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching employers',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Create employer
     */
    createEmployer: async (req, res) => {
        try {
            const { first_name, last_name, email, password, company_id, company_name, position } = req.body;
            
            console.log('Create employer request received:', {
                ...req.body,
                password: password ? '[REDACTED]' : undefined
            });
            
            // Validate input
            if (!first_name || !last_name || !email || !password) {
                console.log('Missing required fields:', { 
                    first_name: !!first_name, 
                    last_name: !!last_name, 
                    email: !!email, 
                    password: !!password 
                });
                return res.status(400).json({
                    success: false,
                    message: 'Please provide all required fields'
                });
            }
            
            // Check if email already exists
            console.log('Checking if email exists:', email);
            const [existingUsers] = await pool.query(
                'SELECT * FROM users_tbl WHERE email = ? AND is_deleted = 0',
                [email]
            );
            
            if (existingUsers.length > 0) {
                console.log('User already exists with email:', email);
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }
            
            // Hash password
            console.log('Hashing password');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            console.log('Starting transaction');
            await pool.query('START TRANSACTION');
            
            try {
                // Resolve company_id
                let resolvedCompanyId = company_id;
                
                // If company_name is provided but no company_id, look up or create company
                if (!company_id && company_name) {
                    console.log('Looking up company by name:', company_name);
                    
                    // Check if company exists
                    const [existingCompany] = await pool.query(
                        'SELECT company_id FROM companies_tbl WHERE company_name = ? AND is_deleted = 0',
                        [company_name]
                    );
                    
                    if (existingCompany.length > 0) {
                        resolvedCompanyId = existingCompany[0].company_id;
                        console.log('Using existing company with ID:', resolvedCompanyId);
                    } else {
                        // Create new company
                        console.log('Creating new company:', company_name);
                        const [companyResult] = await pool.query(
                            'INSERT INTO companies_tbl (company_name, is_deleted) VALUES (?, 0)',
                            [company_name]
                        );
                        resolvedCompanyId = companyResult.insertId;
                        console.log('Created new company with ID:', resolvedCompanyId);
                    }
                }
                
                // Get the column structure for employers_tbl
                const [columns] = await pool.query('SHOW COLUMNS FROM employers_tbl');
                const columnNames = columns.map(col => col.Field);
                console.log('Employers table columns:', columnNames);
                
                // Find the company foreign key column
                const companyFKName = columnNames.includes('company_id') ? 'company_id' : null;
                
                // Insert user record
                console.log('Inserting user record');
                const [userResult] = await pool.query(
                    'INSERT INTO users_tbl (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                    [first_name, last_name, email, hashedPassword, 'Employer']
                );
                
                const userId = userResult.insertId;
                console.log('User created with ID:', userId);
                
                // Prepare fields for employer record
                const employerFields = ['user_id'];
                const employerPlaceholders = ['?'];
                const employerValues = [userId];
                
                // Add company_id if available
                if (companyFKName && resolvedCompanyId) {
                    employerFields.push(companyFKName);
                    employerPlaceholders.push('?');
                    employerValues.push(resolvedCompanyId);
                }
                
                // Add position if available
                if (position && columnNames.includes('position')) {
                    employerFields.push('position');
                    employerPlaceholders.push('?');
                    employerValues.push(position);
                }
                
                // Insert employer record
                console.log('Inserting employer record');
                const employerQuery = `
                    INSERT INTO employers_tbl (${employerFields.join(', ')})
                    VALUES (${employerPlaceholders.join(', ')})
                `;
                console.log('Executing query:', employerQuery, 'with values:', employerValues);
                
                const [employerResult] = await pool.query(employerQuery, employerValues);
                
                console.log('Employer record created with ID:', employerResult.insertId);
                await pool.query('COMMIT');
                
                res.status(201).json({
                    success: true,
                    message: 'Employer created successfully',
                    employerId: employerResult.insertId
                });
            } catch (error) {
                console.error('Error in transaction:', error);
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error creating employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating employer',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Update employer
     */
    updateEmployer: async (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, position, company_id, company_name } = req.body;
            
            console.log('Update employer request received:', { id, first_name, last_name, position, company_id, company_name });
            
            if (!id || id === 'undefined') {
                console.error('Invalid employer ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employer ID provided'
                });
            }
            
            await pool.query('START TRANSACTION');
            
            try {
                // Find the primary key column for employers_tbl
                const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
                const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'employer_id';
                console.log('Using primary key column:', primaryKeyColumn);
                
                // Get the column structure to check for available columns in employers_tbl
                const [columns] = await pool.query('SHOW COLUMNS FROM employers_tbl');
                const columnNames = columns.map(col => col.Field);
                console.log('Employers table columns:', columnNames);
                
                // Get the user_id from the employer record using the identified primary key
                const query = `SELECT user_id FROM employers_tbl WHERE ${primaryKeyColumn} = ?`;
                console.log('Executing query:', query, 'with param:', id);
                
                const [employers] = await pool.query(query, [id]);
                
                if (employers.length === 0) {
                    console.log('Employer not found with ID:', id);
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Employer not found'
                    });
                }
                
                const userId = employers[0].user_id;
                console.log('Employer user_id found:', userId);
                
                // Update the user record
                console.log('Updating user record');
                await pool.query(
                    'UPDATE users_tbl SET first_name = ?, last_name = ? WHERE user_id = ?',
                    [first_name, last_name, userId]
                );
                
                // Prepare update fields for employer record
                const updateFields = [];
                const updateValues = [];
                
                // Handle position field if it exists
                if (position && columnNames.includes('position')) {
                    updateFields.push('position = ?');
                    updateValues.push(position);
                }
                
                // Handle company relationship
                const companyFKName = columnNames.includes('company_id') ? 'company_id' : null;
                
                if (companyFKName) {
                    // Handle company_id if provided directly
                    if (company_id) {
                        updateFields.push(`${companyFKName} = ?`);
                        updateValues.push(company_id);
                    }
                    // Handle company_name by looking up or creating the company
                    else if (company_name) {
                        console.log('Looking up company by name:', company_name);
                        
                        // Find if company exists
                        const [companies] = await pool.query(
                            'SELECT company_id FROM companies_tbl WHERE company_name = ? AND is_deleted = 0',
                            [company_name]
                        );
                        
                        let companyId;
                        
                        if (companies.length > 0) {
                            companyId = companies[0].company_id;
                            console.log('Found existing company with ID:', companyId);
                        } else {
                            // Create new company
                            console.log('Creating new company:', company_name);
                            const [companyResult] = await pool.query(
                                'INSERT INTO companies_tbl (company_name, is_deleted) VALUES (?, 0)',
                                [company_name]
                            );
                            companyId = companyResult.insertId;
                            console.log('Created new company with ID:', companyId);
                        }
                        
                        updateFields.push(`${companyFKName} = ?`);
                        updateValues.push(companyId);
                    }
                }
                
                // Only update employer record if there are fields to update
                if (updateFields.length > 0) {
                    // Add ID to values for WHERE clause
                    updateValues.push(id);
                    
                    const updateQuery = `
                        UPDATE employers_tbl 
                        SET ${updateFields.join(', ')} 
                        WHERE ${primaryKeyColumn} = ?
                    `;
                    console.log('Executing update query:', updateQuery, 'with values:', updateValues);
                    
                    await pool.query(updateQuery, updateValues);
                } else {
                    console.log('No employer-specific fields to update');
                }
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Employer updated successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error updating employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating employer',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Delete employer (soft delete)
     */
    deleteEmployer: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Delete employer request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid employer ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employer ID provided'
                });
            }
            
            await pool.query('START TRANSACTION');
            
            try {
                // Find the primary key column for employers_tbl
                const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
                const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'employer_id';
                console.log('Using primary key column:', primaryKeyColumn);
                
                // Get the user_id from the employer record using the identified primary key
                const query = `SELECT user_id FROM employers_tbl WHERE ${primaryKeyColumn} = ?`;
                console.log('Executing query:', query, 'with param:', id);
                
                const [employers] = await pool.query(query, [id]);
                
                if (employers.length === 0) {
                    await pool.query('ROLLBACK');
                    console.error('Employer not found with ID:', id);
                    return res.status(404).json({
                        success: false,
                        message: 'Employer not found'
                    });
                }
                
                const userId = employers[0].user_id;
                console.log('Employer user_id found:', userId);
                
                // Check if the users_tbl has is_deleted column
                const [userColumns] = await pool.query('SHOW COLUMNS FROM users_tbl');
                const userColumnNames = userColumns.map(col => col.Field);
                console.log('Users table columns:', userColumnNames);
                
                if (!userColumnNames.includes('is_deleted')) {
                    console.error('is_deleted column not found in users_tbl');
                    await pool.query('ROLLBACK');
                    return res.status(500).json({
                        success: false,
                        message: 'Database schema error: is_deleted column not found in users_tbl'
                    });
                }
                
                // Soft delete the user record
                console.log('Soft deleting user record');
                await pool.query(
                    'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                    [userId]
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Employer deleted successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error deleting employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting employer',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Get all companies
     */
    getAllCompanies: async (req, res) => {
        try {
            console.log('Fetching all companies');
            
            // Find the primary key column for companies_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM companies_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'company_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            // Get the column structure to check for available columns
            const [columns] = await pool.query('SHOW COLUMNS FROM companies_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Companies table columns:', columnNames);
            
            // Build a SELECT clause based on available columns
            const selectFields = [`c.${primaryKeyColumn} as id`];
            
            if (columnNames.includes('company_name')) 
                selectFields.push('c.company_name');
                
            if (columnNames.includes('address')) 
                selectFields.push('c.address');
                
            if (columnNames.includes('industry')) 
                selectFields.push('c.industry');
                
            if (columnNames.includes('website')) 
                selectFields.push('c.website');
            
            if (columnNames.includes('industry_sector')) 
                selectFields.push('c.industry_sector as industry');
                
            // Build the query to get all companies with proper field names
            const query = `
                SELECT ${selectFields.join(', ')} 
                FROM companies_tbl c
                ${columnNames.includes('is_deleted') ? 'WHERE c.is_deleted = 0' : ''}
                ORDER BY ${columnNames.includes('company_name') ? 'c.company_name' : 'c.' + primaryKeyColumn}
            `;
            console.log('Executing query:', query);
            
            const [companies] = await pool.query(query);
            console.log(`Found ${companies.length} companies`);
            
            res.json({
                success: true,
                companies
            });
        } catch (error) {
            console.error('Error fetching companies:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching companies',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Create company
     */
    createCompany: async (req, res) => {
        try {
            const { company_name, address, website, industry } = req.body;
            
            console.log('Create company request received:', { company_name, address, website, industry });
            
            // Validate input
            if (!company_name) {
                console.log('Missing required field: company_name');
                return res.status(400).json({
                    success: false,
                    message: 'Company name is required'
                });
            }
            
            // Get the column structure to check for available columns
            const [columns] = await pool.query('SHOW COLUMNS FROM companies_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Companies table columns:', columnNames);
            
            // Prepare fields and values based on available columns and provided data
            const fields = [];
            const placeholders = [];
            const values = [];
            
            // Company name is required
            if (columnNames.includes('company_name')) {
                fields.push('company_name');
                placeholders.push('?');
                values.push(company_name);
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Database schema error: company_name column not found in companies_tbl'
                });
            }
            
            // Optional fields
            if (address && columnNames.includes('address')) {
                fields.push('address');
                placeholders.push('?');
                values.push(address);
            }
            
            if (website && columnNames.includes('website')) {
                fields.push('website');
                placeholders.push('?');
                values.push(website);
            }
            
            if (industry) {
                if (columnNames.includes('industry')) {
                    fields.push('industry');
                    placeholders.push('?');
                    values.push(industry);
                } else if (columnNames.includes('industry_sector')) {
                    fields.push('industry_sector');
                    placeholders.push('?');
                    values.push(industry);
                }
            }
            
            // Add is_deleted field if it exists
            if (columnNames.includes('is_deleted')) {
                fields.push('is_deleted');
                placeholders.push('?');
                values.push(0); // Not deleted by default
            }
            
            const query = `
                INSERT INTO companies_tbl (${fields.join(', ')})
                VALUES (${placeholders.join(', ')})
            `;
            console.log('Executing query:', query, 'with values:', values);
            
            const [result] = await pool.query(query, values);
            
            console.log('Company created with ID:', result.insertId);
            
            res.status(201).json({
                success: true,
                message: 'Company created successfully',
                companyId: result.insertId
            });
        } catch (error) {
            console.error('Error creating company:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating company',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Update company
     */
    updateCompany: async (req, res) => {
        try {
            const { id } = req.params;
            const { company_name, address, website, industry } = req.body;
            
            console.log('Update company request received:', { id, company_name, address, website, industry });
            
            if (!id || id === 'undefined') {
                console.error('Invalid company ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid company ID provided'
                });
            }
            
            // Find the primary key column for companies_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM companies_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'company_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            // Get the column structure to check for available columns
            const [columns] = await pool.query('SHOW COLUMNS FROM companies_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Companies table columns:', columnNames);
            
            // Prepare update fields based on available columns and provided data
            const updateFields = [];
            const updateValues = [];
            
            if (company_name && columnNames.includes('company_name')) {
                updateFields.push('company_name = ?');
                updateValues.push(company_name);
            }
            
            if (address && columnNames.includes('address')) {
                updateFields.push('address = ?');
                updateValues.push(address);
            }
            
            if (website && columnNames.includes('website')) {
                updateFields.push('website = ?');
                updateValues.push(website);
            }
            
            if (industry) {
                if (columnNames.includes('industry')) {
                    updateFields.push('industry = ?');
                    updateValues.push(industry);
                } else if (columnNames.includes('industry_sector')) {
                    updateFields.push('industry_sector = ?');
                    updateValues.push(industry);
                }
            }
            
            if (updateFields.length === 0) {
                console.log('No valid fields to update');
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }
            
            // Add the ID to the values array
            updateValues.push(id);
            
            const query = `
                UPDATE companies_tbl 
                SET ${updateFields.join(', ')}
                WHERE ${primaryKeyColumn} = ?
            `;
            console.log('Executing query:', query, 'with values:', updateValues);
            
            await pool.query(query, updateValues);
            
            res.json({
                success: true,
                message: 'Company updated successfully'
            });
        } catch (error) {
            console.error('Error updating company:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating company',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Delete company (soft delete)
     */
    deleteCompany: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Delete company request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid company ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid company ID provided'
                });
            }
            
            // Find the primary key column for companies_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM companies_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'company_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            // Get the column structure to check if is_deleted exists
            const [columns] = await pool.query('SHOW COLUMNS FROM companies_tbl');
            const columnNames = columns.map(col => col.Field);
            console.log('Companies table columns:', columnNames);
            
            const hasIsDeleted = columnNames.includes('is_deleted');
            
            if (!hasIsDeleted) {
                console.log('is_deleted column not found in companies_tbl');
                return res.status(500).json({
                    success: false,
                    message: 'Database schema error: is_deleted column not found in companies_tbl'
                });
            }
            
            // Check if there are any active employers using this company
            // First, find the primary key column for employers_tbl
            const [empPrimaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
            const empPrimaryKeyColumn = empPrimaryKeyInfo.length > 0 ? empPrimaryKeyInfo[0].Column_name : 'employer_id';
            console.log('Using employer primary key column:', empPrimaryKeyColumn);
            
            // Get the column structure for employers_tbl
            const [empColumns] = await pool.query('SHOW COLUMNS FROM employers_tbl');
            const empColumnNames = empColumns.map(col => col.Field);
            console.log('Employers table columns:', empColumnNames);
            
            const companyFKName = empColumnNames.includes('company_id') ? 'company_id' : null;
            
            if (!companyFKName) {
                console.error('company_id column not found in employers_tbl');
                return res.status(500).json({
                    success: false,
                    message: 'Database schema error: company_id column not found in employers_tbl'
                });
            }
            
            // Check for active employers using this company
            const employerQuery = `
                SELECT e.${empPrimaryKeyColumn}
                FROM employers_tbl e
                JOIN users_tbl u ON e.user_id = u.user_id
                WHERE e.${companyFKName} = ? AND u.is_deleted = 0
                LIMIT 1
            `;
            console.log('Executing employer check query:', employerQuery, 'with param:', id);
            
            const [employers] = await pool.query(employerQuery, [id]);
            
            if (employers.length > 0) {
                console.log('Cannot delete company: There are employers associated with this company');
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete company: There are employers associated with this company'
                });
            }
            
            // Soft delete the company
            const deleteQuery = `
                UPDATE companies_tbl 
                SET is_deleted = 1 
                WHERE ${primaryKeyColumn} = ?
            `;
            console.log('Executing delete query:', deleteQuery, 'with param:', id);
            
            await pool.query(deleteQuery, [id]);
            
            res.json({
                success: true,
                message: 'Company deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting company:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting company',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Archive company (soft delete)
     */
    archiveCompany: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('Archive company request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid company ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid company ID provided'
                });
            }
            
            // Find the primary key column for companies_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM companies_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'company_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            await pool.query('START TRANSACTION');
            
            try {
                // Check if archived_companies_tbl exists and create it if it doesn't
                const [tables] = await pool.query('SHOW TABLES LIKE "archived_companies_tbl"');
                
                if (tables.length === 0) {
                    console.log('Creating archived_companies_tbl as it does not exist');
                    
                    await pool.query(`
                        CREATE TABLE archived_companies_tbl (
                            archive_id INT AUTO_INCREMENT PRIMARY KEY,
                            original_company_id INT NOT NULL,
                            company_name VARCHAR(255),
                            address VARCHAR(255),
                            industry VARCHAR(255),
                            website VARCHAR(255),
                            archived_by INT NOT NULL,
                            archived_date DATETIME NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    
                    console.log('archived_companies_tbl created successfully');
                }
                
                // Get the company details before archiving
                const [companyDetails] = await pool.query(`
                    SELECT * FROM companies_tbl
                    WHERE ${primaryKeyColumn} = ?
                `, [id]);
                
                if (companyDetails.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Company not found'
                    });
                }
                
                const company = companyDetails[0];
                
                // Insert into archived_companies_tbl
                await pool.query(`
                    INSERT INTO archived_companies_tbl (
                        original_company_id, company_name, address, industry, website,
                        archived_by, archived_date
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                `, [
                    id, 
                    company.company_name, 
                    company.address || null, 
                    company.industry || company.industry_sector || null, 
                    company.website || null,
                    req.user.user_id
                ]);
                
                // Soft delete the company
                const deleteQuery = `
                    UPDATE companies_tbl 
                    SET is_deleted = 1 
                    WHERE ${primaryKeyColumn} = ?
                `;
                console.log('Executing archive query:', deleteQuery, 'with param:', id);
                
                await pool.query(deleteQuery, [id]);
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Company archived successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error archiving company:', error);
            res.status(500).json({
                success: false,
                message: 'Error archiving company',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Get dashboard statistics for admin
     */
    getDashboardStats: async (req, res) => {
        try {
            // Get count of active interns
            const [internCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM interns_tbl i
                JOIN users_tbl u ON i.user_id = u.user_id
                WHERE u.is_deleted = 0
            `);
            
            // Get count of faculty
            const [facultyCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM faculties_tbl f
                JOIN users_tbl u ON f.user_id = u.user_id
                WHERE u.is_deleted = 0
            `);
            
            // Get count of employers
            const [employerCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM employers_tbl e
                JOIN users_tbl u ON e.user_id = u.user_id
                WHERE u.is_deleted = 0
            `);
            
            // Get count of companies
            const [companyCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM companies_tbl
                WHERE is_deleted = 0
            `);
            
            // Get count of job listings
            const [jobCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM job_listings_tbl
                WHERE is_deleted = 0
            `);
            
            // Get count of applications
            const [applicationCount] = await pool.query(`
                SELECT COUNT(*) as count
                FROM applications_tbl
                WHERE is_deleted = 0
            `);
            
            res.json({
                success: true,
                stats: {
                    internCount: internCount[0].count,
                    facultyCount: facultyCount[0].count,
                    employerCount: employerCount[0].count,
                    companyCount: companyCount[0].count,
                    jobCount: jobCount[0].count,
                    applicationCount: applicationCount[0].count
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard statistics',
                error: error.message
            });
        }
    },

    /**
     * Restore archived company
     */
    restoreArchivedCompany: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Restore archived company request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid company ID provided'
                });
            }
            
            // Check if the archived_companies_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_companies_tbl"');
            
            if (tables.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived companies table not found'
                });
            }
            
            // Start a transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Get the archived company
                const [archivedCompanies] = await pool.query(
                    'SELECT * FROM archived_companies_tbl WHERE archive_id = ? OR original_company_id = ?',
                    [id, id]
                );
                
                if (archivedCompanies.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Archived company not found'
                    });
                }
                
                const archivedCompany = archivedCompanies[0];
                
                // Check if the company already exists (might have been recreated)
                const [existingCompanies] = await pool.query(
                    'SELECT * FROM companies_tbl WHERE company_id = ?',
                    [archivedCompany.original_company_id]
                );
                
                if (existingCompanies.length > 0) {
                    // Company exists, just update is_deleted flag
                    await pool.query(
                        'UPDATE companies_tbl SET is_deleted = 0 WHERE company_id = ?',
                        [archivedCompany.original_company_id]
                    );
                } else {
                    // Company doesn't exist, recreate it
                    await pool.query(`
                        INSERT INTO companies_tbl 
                        (company_id, company_name, address, industry, website, created_at)
                        VALUES (?, ?, ?, ?, ?, NOW())`,
                        [
                            archivedCompany.original_company_id,
                            archivedCompany.company_name,
                            archivedCompany.address,
                            archivedCompany.industry,
                            archivedCompany.website
                        ]
                    );
                }
                
                // Remove from archive
                await pool.query(
                    'DELETE FROM archived_companies_tbl WHERE archive_id = ?',
                    [archivedCompany.archive_id]
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Company restored successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error restoring archived company:', error);
            res.status(500).json({
                success: false,
                message: 'Error restoring archived company',
                error: error.message
            });
        }
    },
    
    /**
     * Permanently delete archived company
     */
    permanentlyDeleteArchivedCompany: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Permanently delete archived company request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid company ID provided'
                });
            }
            
            // Delete from archive
            const [result] = await pool.query(
                'DELETE FROM archived_companies_tbl WHERE archive_id = ? OR original_company_id = ?',
                [id, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived company not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Archived company permanently deleted'
            });
        } catch (error) {
            console.error('Error permanently deleting archived company:', error);
            res.status(500).json({
                success: false,
                message: 'Error permanently deleting archived company',
                error: error.message
            });
        }
    },

    /**
     * Restore archived faculty
     */
    restoreArchivedFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Restore archived faculty request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid faculty ID provided'
                });
            }
            
            // Check if the archived_faculties_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_faculties_tbl"');
            
            if (tables.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived faculties table not found'
                });
            }
            
            // Start a transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Get the archived faculty
                const [archivedFaculties] = await pool.query(
                    'SELECT * FROM archived_faculties_tbl WHERE archive_id = ? OR original_faculty_id = ?',
                    [id, id]
                );
                
                if (archivedFaculties.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Archived faculty not found'
                    });
                }
                
                const archivedFaculty = archivedFaculties[0];
                
                // Restore the user
                const [existingUsers] = await pool.query(
                    'SELECT * FROM users_tbl WHERE user_id = ?',
                    [archivedFaculty.user_id]
                );
                
                if (existingUsers.length > 0) {
                    // User exists, just update is_deleted flag
                    await pool.query(
                        'UPDATE users_tbl SET is_deleted = 0 WHERE user_id = ?',
                        [archivedFaculty.user_id]
                    );
                } else {
                    // User doesn't exist, recreate it
                    await pool.query(`
                        INSERT INTO users_tbl 
                        (user_id, first_name, last_name, email, role, is_deleted, created_at)
                        VALUES (?, ?, ?, ?, 'faculty', 0, NOW())`,
                        [
                            archivedFaculty.user_id,
                            archivedFaculty.first_name,
                            archivedFaculty.last_name,
                            archivedFaculty.email
                        ]
                    );
                }
                
                // Check if faculty record still exists
                const [existingFaculty] = await pool.query(
                    'SELECT * FROM faculties_tbl WHERE id = ?',
                    [archivedFaculty.original_faculty_id]
                );
                
                if (existingFaculty.length === 0) {
                    // Faculty doesn't exist, recreate it
                    await pool.query(`
                        INSERT INTO faculties_tbl 
                        (id, user_id, department, created_at)
                        VALUES (?, ?, ?, NOW())`,
                        [
                            archivedFaculty.original_faculty_id,
                            archivedFaculty.user_id,
                            archivedFaculty.department
                        ]
                    );
                }
                
                // Remove from archive
                await pool.query(
                    'DELETE FROM archived_faculties_tbl WHERE archive_id = ?',
                    [archivedFaculty.archive_id]
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Faculty restored successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error restoring archived faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error restoring archived faculty',
                error: error.message
            });
        }
    },
    
    /**
     * Permanently delete archived faculty
     */
    permanentlyDeleteArchivedFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Permanently delete archived faculty request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid faculty ID provided'
                });
            }
            
            // Delete from archive
            const [result] = await pool.query(
                'DELETE FROM archived_faculties_tbl WHERE archive_id = ? OR original_faculty_id = ?',
                [id, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived faculty not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Archived faculty permanently deleted'
            });
        } catch (error) {
            console.error('Error permanently deleting archived faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error permanently deleting archived faculty',
                error: error.message
            });
        }
    },
    
    /**
     * Restore archived employer
     */
    restoreArchivedEmployer: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Restore archived employer request received for ID:', id);
            
            if (!id) {
                console.error('Invalid or missing employer ID provided');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employer ID provided'
                });
            }
            
            // Ensure ID is a number if possible
            const parsedId = parseInt(id, 10);
            const idToUse = !isNaN(parsedId) ? parsedId : id;
            console.log('Using ID for restoration:', idToUse);
            
            // Check if the archived_employers_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_employers_tbl"');
            
            if (tables.length === 0) {
                console.error('Archived employers table not found');
                return res.status(404).json({
                    success: false,
                    message: 'Archived employers table not found'
                });
            }
            
            // Start a transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Get the archived employer
                console.log('Fetching archived employer with ID:', idToUse);
                const [archivedEmployers] = await pool.query(
                    'SELECT * FROM archived_employers_tbl WHERE archive_id = ?',
                    [idToUse]
                );
                
                console.log('Found archived employers:', archivedEmployers.length);
                
                if (archivedEmployers.length === 0) {
                    console.error('No archived employer found with ID:', idToUse);
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Archived employer not found'
                    });
                }
                
                const archivedEmployer = archivedEmployers[0];
                console.log('Retrieved archived employer:', {
                    archive_id: archivedEmployer.archive_id,
                    user_id: archivedEmployer.user_id,
                    original_employer_id: archivedEmployer.original_employer_id
                });
                
                // Restore the user
                console.log('Checking if user exists:', archivedEmployer.user_id);
                const [existingUsers] = await pool.query(
                    'SELECT * FROM users_tbl WHERE user_id = ?',
                    [archivedEmployer.user_id]
                );
                
                if (existingUsers.length > 0) {
                    // User exists, just update is_deleted flag
                    console.log('User exists, updating is_deleted flag');
                    await pool.query(
                        'UPDATE users_tbl SET is_deleted = 0 WHERE user_id = ?',
                        [archivedEmployer.user_id]
                    );
                } else {
                    // User doesn't exist, recreate it
                    console.log('User does not exist, recreating');
                    await pool.query(`
                        INSERT INTO users_tbl 
                        (user_id, first_name, last_name, email, role, is_deleted, created_at)
                        VALUES (?, ?, ?, ?, 'Employer', 0, NOW())`,
                        [
                            archivedEmployer.user_id,
                            archivedEmployer.first_name,
                            archivedEmployer.last_name,
                            archivedEmployer.email
                        ]
                    );
                }
                
                // Find the primary key column for employers_tbl
                console.log('Determining primary key column for employers_tbl');
                const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
                const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'id';
                console.log('Using primary key column for employers_tbl:', primaryKeyColumn);
                
                // Get the columns in employers_tbl table
                console.log('Getting columns in employers_tbl');
                const [columns] = await pool.query('SHOW COLUMNS FROM employers_tbl');
                const columnNames = columns.map(col => col.Field);
                console.log('Employers table columns:', columnNames);
                
                // Check if employer record still exists
                console.log('Checking if employer record exists with ID:', archivedEmployer.original_employer_id);
                const selectQuery = `SELECT * FROM employers_tbl WHERE ${primaryKeyColumn} = ?`;
                console.log('Query:', selectQuery);
                
                const [existingEmployer] = await pool.query(
                    selectQuery,
                    [archivedEmployer.original_employer_id]
                );
                
                if (existingEmployer.length === 0) {
                    // Employer doesn't exist, recreate it
                    console.log('Employer record does not exist, recreating');
                    
                    // Prepare insert query based on available columns
                    let insertFields = ['user_id'];
                    let insertPlaceholders = ['?'];
                    let insertValues = [archivedEmployer.user_id];
                    
                    // Add company_id if it exists in the table
                    if (columnNames.includes('company_id') && archivedEmployer.company_id) {
                        insertFields.push('company_id');
                        insertPlaceholders.push('?');
                        insertValues.push(archivedEmployer.company_id);
                    }
                    
                    // Add position if it exists in the table
                    if (columnNames.includes('position') && archivedEmployer.position) {
                        insertFields.push('position');
                        insertPlaceholders.push('?');
                        insertValues.push(archivedEmployer.position);
                    }
                    
                    // Try to include the original ID if the primary key is in the columns
                    let includeOriginalId = false;
                    if (columnNames.includes(primaryKeyColumn)) {
                        insertFields.push(primaryKeyColumn);
                        insertPlaceholders.push('?');
                        insertValues.push(archivedEmployer.original_employer_id);
                        includeOriginalId = true;
                    }
                    
                    const insertQuery = `
                        INSERT INTO employers_tbl 
                        (${insertFields.join(', ')})
                        VALUES (${insertPlaceholders.join(', ')})
                    `;
                    console.log('Insert query:', insertQuery);
                    console.log('Insert values:', insertValues);
                    
                    try {
                        await pool.query(insertQuery, insertValues);
                        console.log('Employer record recreated successfully');
                    } catch (err) {
                        console.error('Error recreating employer record:', err);
                        
                        // If we tried to include the original ID and got a duplicate error, try without it
                        if (includeOriginalId && err.code === 'ER_DUP_ENTRY') {
                            console.log('Trying insert without specifying original ID');
                            
                            // Remove the last item (primary key) from our arrays
                            insertFields.pop();
                            insertPlaceholders.pop();
                            insertValues.pop();
                            
                            const fallbackQuery = `
                                INSERT INTO employers_tbl 
                                (${insertFields.join(', ')})
                                VALUES (${insertPlaceholders.join(', ')})
                            `;
                            console.log('Fallback query:', fallbackQuery);
                            console.log('Fallback values:', insertValues);
                            
                            await pool.query(fallbackQuery, insertValues);
                            console.log('Employer record recreated successfully with fallback');
                        } else {
                            throw err;
                        }
                    }
                } else {
                    console.log('Employer record exists');
                }
                
                // Remove from archive
                console.log('Removing from archive, archive_id:', archivedEmployer.archive_id);
                await pool.query(
                    'DELETE FROM archived_employers_tbl WHERE archive_id = ?',
                    [archivedEmployer.archive_id]
                );
                
                await pool.query('COMMIT');
                console.log('Employer restored successfully');
                
                res.json({
                    success: true,
                    message: 'Employer restored successfully'
                });
            } catch (error) {
                console.error('Error in restoration transaction:', error);
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error restoring archived employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error restoring archived employer',
                error: error.message,
                stack: error.stack
            });
        }
    },
    
    /**
     * Permanently delete archived employer
     */
    permanentlyDeleteArchivedEmployer: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Permanently delete archived employer request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employer ID provided'
                });
            }
            
            // Delete from archive
            const [result] = await pool.query(
                'DELETE FROM archived_employers_tbl WHERE archive_id = ? OR original_employer_id = ?',
                [id, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived employer not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Archived employer permanently deleted'
            });
        } catch (error) {
            console.error('Error permanently deleting archived employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error permanently deleting archived employer',
                error: error.message
            });
        }
    },

    /**
     * Get all archived companies
     */
    getArchivedCompanies: async (req, res) => {
        try {
            // Check if the archived_companies_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_companies_tbl"');
            
            if (tables.length === 0) {
                console.log('The archived_companies_tbl does not exist yet');
                return res.json({
                    success: true,
                    archivedCompanies: []
                });
            }
            
            // Fetch the archived companies
            const [archivedCompanies] = await pool.query(`
                SELECT * FROM archived_companies_tbl
                ORDER BY archived_date DESC
            `);
            
            res.json({
                success: true,
                archivedCompanies
            });
        } catch (error) {
            console.error('Error fetching archived companies:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching archived companies',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Get all archived faculty
     */
    getArchivedFaculty: async (req, res) => {
        try {
            // Check if the archived_faculties_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_faculties_tbl"');
            
            if (tables.length === 0) {
                console.log('The archived_faculties_tbl does not exist yet');
                return res.json({
                    success: true,
                    archivedFaculty: []
                });
            }
            
            // Fetch the archived faculty
            const [archivedFaculty] = await pool.query(`
                SELECT * FROM archived_faculties_tbl
                ORDER BY archived_date DESC
            `);
            
            res.json({
                success: true,
                archivedFaculty
            });
        } catch (error) {
            console.error('Error fetching archived faculty:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching archived faculty',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Get all archived employers
     */
    getArchivedEmployers: async (req, res) => {
        try {
            // Check if the archived_employers_tbl exists
            const [tables] = await pool.query('SHOW TABLES LIKE "archived_employers_tbl"');
            
            if (tables.length === 0) {
                console.log('The archived_employers_tbl does not exist yet');
                return res.json({
                    success: true,
                    archivedEmployers: []
                });
            }
            
            // Fetch the archived employers
            const [archivedEmployers] = await pool.query(`
                SELECT * FROM archived_employers_tbl
                ORDER BY archived_date DESC
            `);
            
            res.json({
                success: true,
                archivedEmployers
            });
        } catch (error) {
            console.error('Error fetching archived employers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching archived employers',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Archive employer (soft delete)
     */
    archiveEmployer: async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('Archive employer request received for ID:', id);
            
            if (!id || id === 'undefined') {
                console.error('Invalid employer ID provided:', id);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employer ID provided'
                });
            }
            
            // Find the primary key column for employers_tbl
            const [primaryKeyInfo] = await pool.query('SHOW KEYS FROM employers_tbl WHERE Key_name = "PRIMARY"');
            const primaryKeyColumn = primaryKeyInfo.length > 0 ? primaryKeyInfo[0].Column_name : 'employer_id';
            console.log('Using primary key column:', primaryKeyColumn);
            
            await pool.query('START TRANSACTION');
            
            try {
                // Check if archived_employers_tbl exists and create it if it doesn't
                const [tables] = await pool.query('SHOW TABLES LIKE "archived_employers_tbl"');
                
                if (tables.length === 0) {
                    console.log('Creating archived_employers_tbl as it does not exist');
                    
                    await pool.query(`
                        CREATE TABLE archived_employers_tbl (
                            archive_id INT AUTO_INCREMENT PRIMARY KEY,
                            original_employer_id INT NOT NULL,
                            user_id INT NOT NULL,
                            company_id INT,
                            company_name VARCHAR(255),
                            position VARCHAR(255),
                            first_name VARCHAR(255) NOT NULL,
                            last_name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            archived_by INT NOT NULL,
                            archived_date DATETIME NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    
                    console.log('archived_employers_tbl created successfully');
                }
                
                // Get the employer details before archiving
                console.log(`Fetching employer details for ID: ${id}`);
                const [employerDetails] = await pool.query(`
                    SELECT e.*, u.first_name, u.last_name, u.email, c.company_name
                    FROM employers_tbl e
                    JOIN users_tbl u ON e.user_id = u.user_id
                    LEFT JOIN companies_tbl c ON e.company_id = c.company_id
                    WHERE e.${primaryKeyColumn} = ?
                `, [id]);
                
                console.log(`Query results:`, employerDetails);
                
                if (employerDetails.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Employer not found'
                    });
                }
                
                const employer = employerDetails[0];
                const userId = employer.user_id;
                
                console.log(`Archiving employer: ${employer.first_name} ${employer.last_name}`);
                
                // Insert into archived_employers_tbl
                await pool.query(`
                    INSERT INTO archived_employers_tbl (
                        original_employer_id, user_id, company_id, company_name, position,
                        first_name, last_name, email, archived_by, archived_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    id, 
                    userId, 
                    employer.company_id || null, 
                    employer.company_name || null, 
                    employer.position || null,
                    employer.first_name, 
                    employer.last_name, 
                    employer.email, 
                    req.user.user_id
                ]);
                
                // Soft delete the user record
                await pool.query(
                    'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                    [userId]
                );
                
                await pool.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Employer archived successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error archiving employer:', error);
            res.status(500).json({
                success: false,
                message: 'Error archiving employer',
                error: error.message,
                stack: error.stack
            });
        }
    },

    /**
     * Archive an intern
     */
    archiveIntern: async (req, res) => {
        try {
            console.log('Archiving intern...');
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Intern ID is required'
                });
            }
            
            console.log(`Processing archive request for intern ID: ${id}`);
            
            // Check if archived_interns_tbl exists, create if not
            console.log('Checking for archived_interns_tbl existence...');
            const [tables] = await pool.query(
                "SHOW TABLES LIKE 'archived_interns_tbl'"
            );
            
            if (tables.length === 0) {
                console.log('Creating archived_interns_tbl...');
                await pool.query(`
                    CREATE TABLE archived_interns_tbl (
                        archive_id INT AUTO_INCREMENT PRIMARY KEY,
                        original_intern_id INT NOT NULL,
                        user_id INT NOT NULL,
                        student_id VARCHAR(20),
                        department VARCHAR(255),
                        course VARCHAR(255),
                        first_name VARCHAR(100) NOT NULL,
                        last_name VARCHAR(100) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        archived_by INT NOT NULL,
                        archived_date DATETIME NOT NULL
                    )
                `);
                console.log('archived_interns_tbl created successfully');
            } else {
                // Check table structure to ensure it has all needed columns
                console.log('Checking archived_interns_tbl structure...');
                const [columns] = await pool.query('DESCRIBE archived_interns_tbl');
                const columnNames = columns.map(col => col.Field);
                console.log('Existing columns:', columnNames);
            }
            
            // Start transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Get intern details with user information joined
                console.log('Fetching intern details with user information...');
                const [interns] = await pool.query(
                    `SELECT i.*, u.first_name, u.last_name, u.email 
                     FROM interns_tbl i
                     JOIN users_tbl u ON i.user_id = u.user_id
                     WHERE i.id = ?`,
                    [id]
                );
                
                if (interns.length === 0) {
                    await pool.query('ROLLBACK');
                    console.log('Intern not found');
                    return res.status(404).json({
                        success: false,
                        message: 'Intern not found'
                    });
                }
                
                const intern = interns[0];
                console.log('Intern details found:', intern);
                
                // Insert into archived interns with only the fields that exist in the table
                console.log('Inserting into archived_interns_tbl...');
                
                // Get the user ID of the admin performing the action
                const adminId = req.user && req.user.user_id ? req.user.user_id : 1; // Default to 1 if not available
                
                await pool.query(
                    `INSERT INTO archived_interns_tbl (
                        original_intern_id, user_id, student_id, 
                        department, course, first_name, 
                        last_name, email, archived_by, archived_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        intern.id,
                        intern.user_id,
                        intern.student_id || null,
                        intern.dept || null, // Using dept field for department
                        intern.course || null,
                        intern.first_name || '',
                        intern.last_name || '',
                        intern.email || '',
                        adminId
                    ]
                );
                
                // Soft delete user (update is_deleted flag)
                console.log('Updating user is_deleted flag...');
                await pool.query(
                    'UPDATE users_tbl SET is_deleted = 1 WHERE user_id = ?',
                    [intern.user_id]
                );
                
                // Delete intern
                console.log('Deleting intern from interns_tbl...');
                await pool.query(
                    'DELETE FROM interns_tbl WHERE id = ?',
                    [id]
                );
                
                // Commit the transaction
                await pool.query('COMMIT');
                console.log('Intern archived successfully');
                
                return res.json({
                    success: true,
                    message: 'Intern archived successfully'
                });
            } catch (error) {
                // Rollback the transaction in case of error
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error archiving intern:', error.message);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Error archiving intern',
                error: error.message
            });
        }
    },

    /**
     * Restore archived intern
     */
    restoreArchivedIntern: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Restore archived intern request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid intern ID provided'
                });
            }
            
            try {
                // Check if the archived_interns_tbl exists
                const [tables] = await pool.query('SHOW TABLES LIKE "archived_interns_tbl"');
                
                if (tables.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Archived interns table not found'
                    });
                }
                
                // Start a transaction
                await pool.query('START TRANSACTION');
                
                // Get the archived intern
                const [archivedInterns] = await pool.query(
                    'SELECT * FROM archived_interns_tbl WHERE archive_id = ?',
                    [id]
                );
                
                if (archivedInterns.length === 0) {
                    await pool.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Archived intern not found'
                    });
                }
                
                const archivedIntern = archivedInterns[0];
                console.log('Found archived intern:', archivedIntern);
                
                // Restore the user
                const [existingUsers] = await pool.query(
                    'SELECT * FROM users_tbl WHERE user_id = ?',
                    [archivedIntern.user_id]
                );
                
                if (existingUsers.length > 0) {
                    console.log('User exists, updating is_deleted flag');
                    // User exists, just update is_deleted flag
                    await pool.query(
                        'UPDATE users_tbl SET is_deleted = 0 WHERE user_id = ?',
                        [archivedIntern.user_id]
                    );
                } else {
                    console.log('User does not exist, recreating user');
                    // User doesn't exist, recreate it
                    await pool.query(`
                        INSERT INTO users_tbl 
                        (user_id, first_name, last_name, email, role, is_deleted, created_at)
                        VALUES (?, ?, ?, ?, 'Intern', 0, NOW())`,
                        [
                            archivedIntern.user_id,
                            archivedIntern.first_name,
                            archivedIntern.last_name,
                            archivedIntern.email
                        ]
                    );
                }
                
                // Check if intern record still exists
                const [existingIntern] = await pool.query(
                    'SELECT * FROM interns_tbl WHERE id = ?',
                    [archivedIntern.original_intern_id]
                );
                
                if (existingIntern.length === 0) {
                    console.log('Intern record does not exist, recreating intern');
                    
                    // Get the structure of interns_tbl to know what fields we can insert
                    const [internColumns] = await pool.query('SHOW COLUMNS FROM interns_tbl');
                    const columnNames = internColumns.map(col => col.Field);
                    console.log('Intern table columns:', columnNames);
                    
                    // Create a basic intern record with the information we have
                    await pool.query(`
                        INSERT INTO interns_tbl (id, user_id, student_id, dept, course, verification_status, created_at)
                        VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`,
                        [
                            archivedIntern.original_intern_id,
                            archivedIntern.user_id,
                            archivedIntern.student_id,
                            archivedIntern.department, // Note: department in archive maps to dept in interns_tbl
                            archivedIntern.course
                        ]
                    );
                } else {
                    console.log('Intern record exists, skipping recreation');
                }
                
                // Remove from archive
                await pool.query(
                    'DELETE FROM archived_interns_tbl WHERE archive_id = ?',
                    [id]
                );
                
                await pool.query('COMMIT');
                console.log('Intern restored successfully');
                
                return res.json({
                    success: true,
                    message: 'Intern restored successfully'
                });
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error restoring archived intern:', error.message);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Error restoring archived intern',
                error: error.message
            });
        }
    },
    
    /**
     * Permanently delete archived intern
     */
    permanentlyDeleteArchivedIntern: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Permanently delete archived intern request received for ID:', id);
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid intern ID provided'
                });
            }
            
            // Check if the archived_interns_tbl exists and the intern is in it
            const [archivedIntern] = await pool.query(
                'SELECT * FROM archived_interns_tbl WHERE archive_id = ?',
                [id]
            );
            
            if (archivedIntern.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived intern not found'
                });
            }
            
            // Delete from archive
            const [result] = await pool.query(
                'DELETE FROM archived_interns_tbl WHERE archive_id = ?',
                [id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Archived intern not found'
                });
            }
            
            console.log('Archived intern permanently deleted successfully');
            return res.json({
                success: true,
                message: 'Archived intern permanently deleted'
            });
        } catch (error) {
            console.error('Error permanently deleting archived intern:', error.message);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                success: false,
                message: 'Error permanently deleting archived intern',
                error: error.message
            });
        }
    },

    /**
     * Get intern by id
     */
    getInternById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Get intern info
            const [interns] = await pool.query(
                'SELECT i.*, u.user_id, u.username, u.email, u.role FROM interns_tbl i JOIN users_tbl u ON i.user_id = u.user_id WHERE i.id = ?',
                [id]
            );
            
            if (interns.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Intern not found'
                });
            }
            
            res.json({
                success: true,
                intern: interns[0]
            });
        } catch (error) {
            console.error('Error fetching intern:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching intern'
            });
        }
    },

    // Get attendance records for a specific intern
    getInternAttendance: async (req, res) => {
        try {
            const { internId } = req.params;
            const { startDate, endDate } = req.query;
            
            let query = `
                SELECT a.*, 
                       i.first_name, i.last_name, 
                       c.company_name,
                       ip.start_date as internship_start, 
                       ip.end_date as internship_end,
                       ip.placement_status
                FROM attendance_tracking_tbl a
                JOIN interns_tbl i ON a.intern_id = i.id
                JOIN companies_tbl c ON a.company_id = c.company_id
                LEFT JOIN internship_placements_tbl ip ON (a.intern_id = ip.intern_id AND a.company_id = ip.company_id)
                WHERE a.intern_id = ?
            `;
            
            const queryParams = [internId];
            
            // Add date filters if provided
            if (startDate && endDate) {
                query += ' AND a.date BETWEEN ? AND ?';
                queryParams.push(startDate, endDate);
            } else if (startDate) {
                query += ' AND a.date >= ?';
                queryParams.push(startDate);
            } else if (endDate) {
                query += ' AND a.date <= ?';
                queryParams.push(endDate);
            }
            
            query += ' ORDER BY a.date DESC, a.time_in DESC';
            
            const [attendance] = await pool.query(query, queryParams);
            
            // Calculate statistics
            let totalHours = 0;
            let daysPresent = 0;
            const uniqueDates = new Set();
            
            attendance.forEach(record => {
                if (record.duration) {
                    totalHours += record.duration;
                }
                
                if (!uniqueDates.has(record.date)) {
                    uniqueDates.add(record.date);
                    daysPresent++;
                }
            });
            
            res.json({
                success: true,
                data: {
                    attendance,
                    stats: {
                        totalHours,
                        daysPresent,
                        averageHoursPerDay: daysPresent > 0 ? (totalHours / daysPresent).toFixed(2) : 0
                    }
                }
            });
        } catch (error) {
            console.error('Error getting intern attendance:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching intern attendance records',
                error: error.message
            });
        }
    },
    
    // Get attendance records for all interns
    getAllInternsAttendance: async (req, res) => {
        try {
            const { date, startDate, endDate } = req.query;
            
            let query = `
                SELECT a.*, 
                       i.first_name, i.last_name, i.student_id,
                       c.company_name
                FROM attendance_tracking_tbl a
                JOIN interns_tbl i ON a.intern_id = i.id
                JOIN companies_tbl c ON a.company_id = c.company_id
            `;
            
            const queryParams = [];
            
            // Add date filters if provided
            if (date) {
                query += ' WHERE a.date = ?';
                queryParams.push(date);
            } else if (startDate && endDate) {
                query += ' WHERE a.date BETWEEN ? AND ?';
                queryParams.push(startDate, endDate);
            } else if (startDate) {
                query += ' WHERE a.date >= ?';
                queryParams.push(startDate);
            } else if (endDate) {
                query += ' WHERE a.date <= ?';
                queryParams.push(endDate);
            } else {
                // Default to today if no date parameters are provided
                const today = new Date().toISOString().split('T')[0];
                query += ' WHERE a.date = ?';
                queryParams.push(today);
            }
            
            query += ' ORDER BY a.date DESC, i.last_name, i.first_name, a.time_in';
            
            const [attendance] = await pool.query(query, queryParams);
            
            // Group by intern
            const internMap = new Map();
            
            attendance.forEach(record => {
                const internId = record.intern_id;
                if (!internMap.has(internId)) {
                    internMap.set(internId, {
                        intern_id: internId,
                        first_name: record.first_name,
                        last_name: record.last_name,
                        student_id: record.student_id,
                        company_name: record.company_name,
                        attendance_records: []
                    });
                }
                
                internMap.get(internId).attendance_records.push({
                    date: record.date,
                    time_in: record.time_in,
                    time_out: record.time_out,
                    duration: record.duration,
                    remarks: record.remarks
                });
            });
            
            const groupedAttendance = Array.from(internMap.values());
            
            res.json({
                success: true,
                data: groupedAttendance
            });
        } catch (error) {
            console.error('Error getting all interns attendance:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching attendance records for all interns',
                error: error.message
            });
        }
    },
    
    // Get attendance records for a specific date
    getAttendanceByDate: async (req, res) => {
        try {
            const { date } = req.params;
            
            // Validate date parameter
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Please use YYYY-MM-DD format.'
                });
            }
            
            // Get all interns who should be present on this date based on their internship placements
            const [activeInterns] = await pool.query(`
                SELECT i.id as intern_id, i.first_name, i.last_name, i.student_id,
                       c.company_id, c.company_name
                FROM interns_tbl i
                JOIN internship_placements_tbl ip ON i.id = ip.intern_id
                JOIN companies_tbl c ON ip.company_id = c.company_id
                WHERE ip.placement_status = 'Approved'
                AND ip.start_date <= ? AND ip.end_date >= ?
                AND i.is_deleted = 0
                ORDER BY i.last_name, i.first_name
            `, [date, date]);
            
            // Get attendance records for the given date
            const [attendanceRecords] = await pool.query(`
                SELECT a.*, i.first_name, i.last_name, i.student_id,
                       c.company_name
                FROM attendance_tracking_tbl a
                JOIN interns_tbl i ON a.intern_id = i.id
                JOIN companies_tbl c ON a.company_id = c.company_id
                WHERE a.date = ?
                ORDER BY i.last_name, i.first_name, a.time_in
            `, [date]);
            
            // Create a map of attendance records by intern_id
            const attendanceMap = new Map();
            attendanceRecords.forEach(record => {
                attendanceMap.set(record.intern_id, record);
            });
            
            // Create the final result combining the data
            const result = activeInterns.map(intern => {
                const attendanceRecord = attendanceMap.get(intern.intern_id);
                return {
                    intern_id: intern.intern_id,
                    first_name: intern.first_name,
                    last_name: intern.last_name,
                    student_id: intern.student_id,
                    company_name: intern.company_name,
                    date: date,
                    attendance_status: attendanceRecord ? 'Present' : 'Absent',
                    time_in: attendanceRecord ? attendanceRecord.time_in : null,
                    time_out: attendanceRecord ? attendanceRecord.time_out : null,
                    duration: attendanceRecord ? attendanceRecord.duration : null,
                    remarks: attendanceRecord ? attendanceRecord.remarks : null
                };
            });
            
            // Calculate statistics
            const presentCount = result.filter(r => r.attendance_status === 'Present').length;
            const absentCount = result.filter(r => r.attendance_status === 'Absent').length;
            const totalInterns = result.length;
            const attendanceRate = totalInterns > 0 ? (presentCount / totalInterns * 100).toFixed(2) : 0;
            
            res.json({
                success: true,
                date: date,
                data: result,
                stats: {
                    totalInterns,
                    presentCount,
                    absentCount,
                    attendanceRate: `${attendanceRate}%`
                }
            });
        } catch (error) {
            console.error('Error getting attendance by date:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching attendance records for the specified date',
                error: error.message
            });
        }
    },

    // Get attendance summary for all interns
    getAttendanceSummary: async (req, res) => {
        try {
            const { startDate, endDate, company_id } = req.query;
            
            let whereClause = '';
            const queryParams = [];
            
            if (startDate && endDate) {
                whereClause = ' WHERE a.date BETWEEN ? AND ?';
                queryParams.push(startDate, endDate);
            } else if (startDate) {
                whereClause = ' WHERE a.date >= ?';
                queryParams.push(startDate);
            } else if (endDate) {
                whereClause = ' WHERE a.date <= ?';
                queryParams.push(endDate);
            }
            
            if (company_id) {
                whereClause += whereClause ? ' AND a.company_id = ?' : ' WHERE a.company_id = ?';
                queryParams.push(company_id);
            }
            
            // Get attendance summary grouped by intern
            const [summary] = await pool.query(`
                SELECT 
                    i.id as intern_id,
                    i.first_name,
                    i.last_name,
                    i.student_id,
                    c.company_name,
                    COUNT(DISTINCT a.date) as days_present,
                    SUM(a.duration) as total_hours,
                    MIN(a.date) as first_attendance,
                    MAX(a.date) as last_attendance
                FROM interns_tbl i
                JOIN attendance_tracking_tbl a ON i.id = a.intern_id
                JOIN companies_tbl c ON a.company_id = c.company_id
                ${whereClause}
                GROUP BY i.id, c.company_id
                ORDER BY i.last_name, i.first_name
            `, queryParams);
            
            // Get internship durations for comparison
            const internIds = summary.map(s => s.intern_id);
            let internshipData = [];
            
            if (internIds.length > 0) {
                const placeholders = internIds.map(() => '?').join(',');
                const [internships] = await pool.query(`
                    SELECT 
                        ip.intern_id,
                        ip.start_date,
                        ip.end_date,
                        DATEDIFF(
                            LEAST(ip.end_date, CURDATE()), 
                            GREATEST(ip.start_date, COALESCE(?, ip.start_date))
                        ) + 1 as total_days
                    FROM internship_placements_tbl ip
                    WHERE ip.intern_id IN (${placeholders})
                    AND ip.placement_status = 'Approved'
                `, [startDate || null, ...internIds]);
                
                // Create a map for easy lookup
                const internshipMap = new Map();
                internships.forEach(ip => {
                    internshipMap.set(ip.intern_id, ip);
                });
                
                internshipData = internshipMap;
            }
            
            // Enhance summary with attendance rate
            const enhancedSummary = summary.map(s => {
                const internship = internshipData.get(s.intern_id);
                const totalWorkdays = internship ? 
                    // Calculate work days (excluding weekends) - simplified version
                    Math.floor(internship.total_days * 5/7) : 
                    s.days_present;
                
                const attendanceRate = totalWorkdays > 0 ? 
                    (s.days_present / totalWorkdays * 100).toFixed(2) : 
                    100;
                
                return {
                    ...s,
                    internship_start: internship ? internship.start_date : null,
                    internship_end: internship ? internship.end_date : null,
                    expected_days: totalWorkdays,
                    attendance_rate: `${Math.min(100, attendanceRate)}%`
                };
            });
            
            res.json({
                success: true,
                data: enhancedSummary
            });
        } catch (error) {
            console.error('Error getting attendance summary:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching attendance summary',
                error: error.message
            });
        }
    },
};

module.exports = adminController; 