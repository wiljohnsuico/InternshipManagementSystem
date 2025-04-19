const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
        multipleStatements: true
    });

    try {
        // Read and execute the setup.sql file
        const fs = require('fs');
        const path = require('path');
        const setupSQL = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
        
        // Split into individual statements and execute them
        const statements = setupSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
            try {
                await connection.query(statement);
                console.log('Successfully executed statement');
            } catch (error) {
                console.error('Error executing statement:', error);
                throw error;
            }
        }

        console.log('Database schema created successfully');

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

        // Create an admin user if none exists
        const [existingAdmins] = await connection.query('SELECT COUNT(*) as count FROM users_tbl WHERE role = "Admin"');
        if (existingAdmins[0].count === 0) {
            console.log('Creating admin user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password', 10);
            
            // Create admin user
            const [adminResult] = await connection.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role, contact_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Admin', 'User', 'admin@example.com', hashedPassword, 'Admin', '1234567890']
            );
            console.log('Admin user created successfully');
            
            // Create corresponding admin profile
            await connection.query(
                `INSERT INTO admins_tbl (user_id, department) 
                 VALUES (?, ?)`,
                [adminResult.insertId, 'Test Department']
            );
            console.log('Test admin profile created successfully');
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('Database setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database setup failed:', error);
        process.exit(1);
    }); 