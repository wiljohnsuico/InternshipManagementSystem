const mysql = require('mysql2/promise');
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
    queueLimit: 0
});

// Test the connection and database setup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to MySQL database');

        // Test if the users_tbl exists
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Available tables:', tables.map(t => Object.values(t)[0]));

        // Check users_tbl structure
        const [columns] = await connection.query('DESCRIBE users_tbl');
        console.log('users_tbl structure:', columns);

        connection.release();
    } catch (err) {
        console.error('Database connection/setup error:', err);
        console.error('Full error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
    }
}

testConnection();

module.exports = pool; 