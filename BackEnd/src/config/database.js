const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Database configuration:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'qcu_ims'
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qcu_ims',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Wrap the pool query to add error handling
const wrappedPool = {
    query: async (...args) => {
        try {
            const result = await pool.query(...args);
            return result;
        } catch (error) {
            console.error('Database query error:', {
                query: args[0],
                params: args[1],
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    beginTransaction: async () => {
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        return conn;
    }
};

// Initialize database schema
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to MySQL database');

        // Check if tables exist
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        // If no tables exist, run the setup script
        if (tableNames.length === 0) {
            console.log('No tables found. Running initial setup...');
            
            // Read and execute the setup.sql file
            const setupSQL = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
            
            // Split into individual statements and execute them
            const statements = setupSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);
            
            for (const statement of statements) {
                try {
                    await connection.query(statement);
                    console.log('Successfully executed schema statement');
                } catch (error) {
                    console.error('Error executing schema statement:', error);
                }
            }

            // Create test users
            const bcrypt = require('bcryptjs');
            const hashedPassword1 = await bcrypt.hash('password123', 10);
            const hashedPassword2 = await bcrypt.hash('testtest', 10);
            
            // Create test users with specific IDs
            try {
                // Test user 1
                console.log('Creating test user 1...');
                await connection.query(
                    `INSERT INTO users_tbl (user_id, first_name, last_name, email, password, role) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [1, 'Test', 'User', 'test@example.com', hashedPassword1, 'Intern']
                );
                console.log('Test user 1 created successfully');
                
                // Create corresponding intern profile
                await connection.query(
                    `INSERT INTO interns_tbl (user_id, course, skills) 
                     VALUES (?, ?, ?)`,
                    [1, 'Test Course', '[]']
                );
                console.log('Test intern profile 1 created successfully');
                
                // Test user 2 - Justin Cabang with password 'testtest'
                console.log('Creating test user 2...');
                await connection.query(
                    `INSERT INTO users_tbl (user_id, first_name, last_name, email, password, role) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [2, 'Justin', 'Cabang', 'justincabang@gmail.com', hashedPassword2, 'Intern']
                );
                console.log('Test user 2 created successfully');
                
                // Create corresponding intern profile
                await connection.query(
                    `INSERT INTO interns_tbl (user_id, course, skills) 
                     VALUES (?, ?, ?)`,
                    [2, 'Computer Science', '[]']
                );
                console.log('Test intern profile 2 created successfully');
            } catch (error) {
                console.error('Error creating test users:', error);
            }
        } else {
            console.log('Tables already exist, checking for test users');
            
            // Check if specific user with ID 2 exists
            const [user2] = await connection.query('SELECT * FROM users_tbl WHERE user_id = 2');
            if (user2.length === 0) {
                console.log('User with ID 2 not found, creating now...');
                try {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash('testtest', 10);
                    
                    await connection.query(
                        `INSERT INTO users_tbl (user_id, first_name, last_name, email, password, role) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [2, 'Justin', 'Cabang', 'justincabang@gmail.com', hashedPassword, 'Intern']
                    );
                    console.log('User 2 created successfully');
                    
                    // Check if intern profile exists for user 2
                    const [profile] = await connection.query('SELECT * FROM interns_tbl WHERE user_id = 2');
                    if (profile.length === 0) {
                        await connection.query(
                            `INSERT INTO interns_tbl (user_id, course, skills) 
                             VALUES (?, ?, ?)`,
                            [2, 'Computer Science', '[]']
                        );
                        console.log('Created intern profile for user 2');
                    }
                } catch (error) {
                    console.error('Error creating user 2:', error);
                }
            } else {
                console.log('User with ID 2 already exists');
                
                // Update password for user 2 if it exists
                try {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash('testtest', 10);
                    
                    await connection.query(
                        `UPDATE users_tbl SET password = ? WHERE user_id = 2`,
                        [hashedPassword]
                    );
                    console.log('Updated password for user 2');
                } catch (error) {
                    console.error('Error updating password for user 2:', error);
                }
                
                // Check if intern profile exists for user 2
                const [profile] = await connection.query('SELECT * FROM interns_tbl WHERE user_id = 2');
                if (profile.length === 0) {
                    try {
                        await connection.query(
                            `INSERT INTO interns_tbl (user_id, course, skills) 
                             VALUES (?, ?, ?)`,
                            [2, 'Computer Science', '[]']
                        );
                        console.log('Created intern profile for user 2');
                    } catch (error) {
                        console.error('Error creating intern profile for user 2:', error);
                    }
                }
            }
        }

        // Verify tables
        const [finalTables] = await connection.query('SHOW TABLES');
        console.log('Available tables:', finalTables.map(t => Object.values(t)[0]));
        
        // Verify users
        const [users] = await connection.query('SELECT user_id, email, role FROM users_tbl');
        console.log('Available users:', users);

        connection.release();
        console.log('Database initialization completed successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
        console.error('Full error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
    }
}

// Add error handling for the pool
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.');
    }
});

// Initialize database on startup
initializeDatabase();

module.exports = wrappedPool; 