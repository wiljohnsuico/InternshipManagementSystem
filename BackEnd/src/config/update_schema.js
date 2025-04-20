// Script to update the database schema
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateSchema() {
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

        // Check if columns exist in applications table
        const [columnsResult] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'qcu_ims' 
            AND TABLE_NAME = 'applications'
        `);

        const columns = columnsResult.map(col => col.COLUMN_NAME.toLowerCase());
        console.log('Existing columns in applications table:', columns);

        // Add missing columns if needed
        if (!columns.includes('additional_info')) {
            console.log('Adding additional_info column...');
            await connection.query(`
                ALTER TABLE applications 
                ADD COLUMN additional_info JSON AFTER cover_letter
            `);
            console.log('additional_info column added');
        }

        if (!columns.includes('file_info')) {
            console.log('Adding file_info column...');
            await connection.query(`
                ALTER TABLE applications 
                ADD COLUMN file_info JSON AFTER additional_info
            `);
            console.log('file_info column added');
        }

        console.log('Schema update completed successfully!');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the update function
updateSchema(); 