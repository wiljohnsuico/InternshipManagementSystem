const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    // Create connection pool
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, 'migrations', 'add_profile_fields.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Split into individual statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await pool.query(statement);
                console.log('Statement executed successfully');
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migration
runMigration().catch(console.error); 