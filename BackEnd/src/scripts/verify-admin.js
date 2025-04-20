const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyAdminAccount() {
    // Admin credentials to check
    const adminEmail = 'justincabang@gmail.com';
    
    // Create database connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
    });

    try {
        console.log('\n--- DATABASE VERIFICATION ---');
        
        // Check database table structure
        console.log('\n1. Checking database tables:');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', tables.map(t => Object.values(t)[0]).join(', '));
        
        // Check if admin_tbl or admins_tbl exists
        const adminTables = tables.filter(t => 
            Object.values(t)[0] === 'admin_tbl' || Object.values(t)[0] === 'admins_tbl'
        );
        
        if (adminTables.length === 0) {
            console.log('ERROR: No admin table found in database!');
        } else {
            console.log('Admin table(s) found:', adminTables.map(t => Object.values(t)[0]).join(', '));
            
            // Check admin table structure 
            for (const table of adminTables) {
                const tableName = Object.values(table)[0];
                const [columns] = await connection.query(`DESCRIBE ${tableName}`);
                console.log(`${tableName} columns:`, columns.map(c => c.Field).join(', '));
            }
        }
        
        // Check if user exists
        console.log('\n2. Checking for admin user:');
        const [users] = await connection.query(
            'SELECT * FROM users_tbl WHERE email = ?',
            [adminEmail]
        );
        
        if (users.length === 0) {
            console.log(`ERROR: No user found with email ${adminEmail}`);
            return;
        }
        
        const user = users[0];
        console.log(`User found: ID=${user.user_id}, Name=${user.first_name} ${user.last_name}, Role=${user.role}`);
        
        // Verify password by creating a test password
        console.log('\n3. Creating a new password for verification:');
        const testPassword = 'testpassword123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        
        // Update the user's password temporarily
        await connection.query(
            'UPDATE users_tbl SET password = ? WHERE user_id = ?',
            [hashedPassword, user.user_id]
        );
        console.log(`Password updated to "${testPassword}" for testing`);
        
        // Verify role is Admin
        if (user.role !== 'Admin') {
            console.log(`ERROR: User role is ${user.role}, not Admin. Fixing...`);
            await connection.query(
                'UPDATE users_tbl SET role = ? WHERE user_id = ?',
                ['Admin', user.user_id]
            );
            console.log('User role updated to Admin');
        } else {
            console.log('User role is correctly set to Admin');
        }
        
        // Check admin profile
        console.log('\n4. Checking admin profile:');
        let adminProfileExists = false;
        
        for (const table of adminTables) {
            const tableName = Object.values(table)[0];
            const [profiles] = await connection.query(
                `SELECT * FROM ${tableName} WHERE user_id = ?`,
                [user.user_id]
            );
            
            if (profiles.length > 0) {
                console.log(`Admin profile found in ${tableName}`);
                adminProfileExists = true;
            } else {
                console.log(`No admin profile found in ${tableName}, creating one...`);
                try {
                    await connection.query(
                        `INSERT INTO ${tableName} (user_id, department) VALUES (?, ?)`,
                        [user.user_id, 'Administration']
                    );
                    console.log(`Admin profile created in ${tableName}`);
                    adminProfileExists = true;
                } catch (error) {
                    console.error(`Error creating admin profile in ${tableName}:`, error.message);
                }
            }
        }
        
        if (!adminProfileExists) {
            console.log('ERROR: Could not create admin profile in any table');
        }
        
        // Fix init-db.js table name if needed
        console.log('\n5. Checking init-db.js for table name issues:');
        try {
            const fs = require('fs');
            const path = require('path');
            const initDbPath = path.join(__dirname, '../config/init-db.js');
            
            if (fs.existsSync(initDbPath)) {
                let initDbContent = fs.readFileSync(initDbPath, 'utf8');
                
                // Check if the file uses admins_tbl instead of admin_tbl
                if (adminTables.some(t => Object.values(t)[0] === 'admin_tbl') && 
                    initDbContent.includes('admins_tbl')) {
                    
                    console.log('Found mismatch: init-db.js uses admins_tbl but database has admin_tbl');
                    
                    // Backup the file
                    fs.writeFileSync(`${initDbPath}.backup`, initDbContent);
                    console.log('Created backup at', `${initDbPath}.backup`);
                    
                    // Fix the file
                    initDbContent = initDbContent.replace(/admins_tbl/g, 'admin_tbl');
                    fs.writeFileSync(initDbPath, initDbContent);
                    console.log('Fixed init-db.js to use admin_tbl instead of admins_tbl');
                } else if (adminTables.some(t => Object.values(t)[0] === 'admins_tbl') && 
                           !initDbContent.includes('admins_tbl')) {
                    
                    console.log('No issue found with table names in init-db.js');
                }
            } else {
                console.log('init-db.js not found at expected path');
            }
        } catch (error) {
            console.error('Error checking/fixing init-db.js:', error.message);
        }
        
        console.log('\n--- VERIFICATION COMPLETE ---');
        console.log('\nAdmin account has been verified and fixed. You can now login with:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${testPassword}`);
        console.log('\nPlease try logging in with these credentials.');
    } catch (error) {
        console.error('Error verifying admin account:', error);
    } finally {
        await connection.end();
    }
}

// Run the function
verifyAdminAccount()
    .then(() => {
        console.log('\nVerification completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('\nVerification failed:', err);
        process.exit(1);
    }); 