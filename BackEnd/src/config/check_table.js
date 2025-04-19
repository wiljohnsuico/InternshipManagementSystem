// Script to check table structure
const mysql = require('mysql2/promise');

async function checkTable() {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root', 
            password: '',
            database: 'qcu_ims'
        });

        console.log('Connected to database');

        // Check interns_tbl structure
        const [columns] = await connection.query(`
            DESCRIBE interns_tbl
        `);
        
        console.log('Columns in interns_tbl:', columns);
        
        // Also check applications table
        const [appColumns] = await connection.query(`
            DESCRIBE applications
        `);
        
        console.log('Columns in applications table:', appColumns);
        
        // Check first few rows of interns_tbl
        const [interns] = await connection.query(`
            SELECT * FROM interns_tbl LIMIT 5
        `);
        
        console.log('Sample data from interns_tbl:', interns);
        
    } catch (error) {
        console.error('Error checking table:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the check function
checkTable(); 