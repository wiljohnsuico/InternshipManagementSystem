const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSetup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
        multipleStatements: true // Important for running multiple SQL statements
    });

    try {
        console.log('Connected to database, running setup script...');

        // Read the SQL setup file
        const setupFilePath = path.join(__dirname, '../config/setup.sql');
        const setupScript = fs.readFileSync(setupFilePath, 'utf8');

        // Execute the SQL
        await connection.query(setupScript);

        console.log('Setup script executed successfully!');
    } catch (error) {
        console.error('Error executing setup script:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

// Run the setup function
runSetup()
    .then(() => {
        console.log('Database setup completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Database setup failed:', error);
        process.exit(1);
    }); 