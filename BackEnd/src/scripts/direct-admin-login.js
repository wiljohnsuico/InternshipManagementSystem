const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function directAdminLogin() {
    // Admin email to check
    const adminEmail = 'justincabang@gmail.com';
    
    // Create database connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
    });

    try {
        console.log(`\nSearching for admin user with email: ${adminEmail}`);
        
        // First, check if user exists
        const [users] = await connection.query(
            'SELECT * FROM users_tbl WHERE email = ?',
            [adminEmail]
        );
        
        if (users.length === 0) {
            console.log(`No user found with email ${adminEmail}. Creating one...`);
            
            // Create a new admin user
            const password = 'admin123';
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const [result] = await connection.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role, contact_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Admin', 'User', adminEmail, hashedPassword, 'Admin', '1234567890']
            );
            
            const userId = result.insertId;
            console.log(`Created new admin user with ID: ${userId}`);
            
            // Check if admin table exists
            const [tables] = await connection.query('SHOW TABLES LIKE "admin%"');
            
            if (tables.length > 0) {
                const tableName = Object.values(tables[0])[0];
                console.log(`Creating admin profile in ${tableName}...`);
                
                try {
                    await connection.query(
                        `INSERT INTO ${tableName} (user_id, department) VALUES (?, ?)`,
                        [userId, 'Administration']
                    );
                    console.log(`Admin profile created successfully`);
                } catch (err) {
                    console.log(`Error creating admin profile: ${err.message}`);
                }
            }
            
            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: userId,
                    role: 'Admin',
                    email: adminEmail
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            console.log('\n=== ADMIN ACCESS CREDENTIALS ===');
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${password}`);
            console.log('\n=== JWT TOKEN FOR DIRECT ACCESS ===');
            console.log(token);
            console.log('\nCopy this token into localStorage in the browser:');
            console.log(`localStorage.setItem('adminToken', '${token}')`);
            console.log(`localStorage.setItem('adminUser', '${JSON.stringify({
                user_id: userId,
                role: 'Admin',
                email: adminEmail,
                first_name: 'Admin',
                last_name: 'User'
            }).replace(/"/g, '\\"')}')`);
            
        } else {
            const user = users[0];
            console.log(`Found user: ID=${user.user_id}, Name=${user.first_name} ${user.last_name}, Role=${user.role}`);
            
            // Ensure the user has Admin role
            if (user.role !== 'Admin') {
                console.log(`Updating user role to Admin...`);
                await connection.query(
                    'UPDATE users_tbl SET role = ? WHERE user_id = ?',
                    ['Admin', user.user_id]
                );
                console.log('User role updated to Admin');
            }
            
            // Create a simple password
            const password = 'admin123';
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Update user's password
            await connection.query(
                'UPDATE users_tbl SET password = ? WHERE user_id = ?',
                [hashedPassword, user.user_id]
            );
            console.log(`Updated password to "${password}" for easy login`);
            
            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    role: 'Admin',
                    email: user.email
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            console.log('\n=== ADMIN ACCESS CREDENTIALS ===');
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${password}`);
            console.log('\n=== JWT TOKEN FOR DIRECT ACCESS ===');
            console.log(token);
            console.log('\nCopy this token into localStorage in the browser:');
            console.log(`localStorage.setItem('adminToken', '${token}')`);
            console.log(`localStorage.setItem('adminUser', '${JSON.stringify({
                user_id: user.user_id,
                role: 'Admin',
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }).replace(/"/g, '\\"')}')`);
        }
        
    } catch (error) {
        console.error('Error in direct admin login script:', error);
    } finally {
        await connection.end();
    }
}

// Run the function
directAdminLogin()
    .then(() => {
        console.log('\nDirect admin login process completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('\nDirect admin login failed:', err);
        process.exit(1);
    }); 