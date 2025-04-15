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

        // Create a test user if none exists
        const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users_tbl');
        if (existingUsers[0].count === 0) {
            console.log('Creating test user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            // Create test user
            const [userResult] = await connection.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                ['Test', 'User', 'test@example.com', hashedPassword, 'Intern']
            );
            console.log('Test user created successfully');
            
            // Create corresponding intern profile
            await connection.query(
                `INSERT INTO interns_tbl (user_id, course, skills) 
                 VALUES (?, ?, ?)`,
                [userResult.insertId, 'Test Course', '[]']
            );
            console.log('Test intern profile created successfully');
        }

        // Verify tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Available tables:', tables.map(t => Object.values(t)[0]));

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