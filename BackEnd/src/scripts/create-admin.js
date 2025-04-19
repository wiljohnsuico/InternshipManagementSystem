const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
    // Custom admin credentials
    const adminEmail = 'justincabang@gmail.com';
    const adminPassword = 'renzei1045';
    const firstName = 'Justin';
    const lastName = 'Cabang';
    
    // Create database connection
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims',
    });

    try {
        console.log(`Setting up admin user with email: ${adminEmail}`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Check if user already exists
        const [existingUsers] = await connection.query(
            'SELECT * FROM users_tbl WHERE email = ?', 
            [adminEmail]
        );
        
        let userId;
        
        if (existingUsers.length > 0) {
            console.log('User with this email already exists. Updating credentials and role...');
            
            userId = existingUsers[0].user_id;
            
            // Update existing user's credentials and role
            await connection.query(
                'UPDATE users_tbl SET first_name = ?, last_name = ?, password = ?, role = ? WHERE email = ?',
                [firstName, lastName, hashedPassword, 'Admin', adminEmail]
            );
            
            console.log('User credentials and role updated successfully.');
        } else {
            console.log('Creating new admin user...');
            
            // Create new admin user
            const [result] = await connection.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role, contact_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [firstName, lastName, adminEmail, hashedPassword, 'Admin', '1234567890']
            );
            
            userId = result.insertId;
            console.log(`New admin user created with ID: ${userId}`);
        }
        
        // Try to determine which admin table exists (admin_tbl or admins_tbl)
        const [tables] = await connection.query(`SHOW TABLES LIKE 'admin%'`);
        const adminTableNames = tables.map(t => Object.values(t)[0]);
        
        console.log('Found admin tables:', adminTableNames);
        
        // Try both table names
        if (adminTableNames.includes('admin_tbl')) {
            try {
                // Check if admin profile exists
                const [existingAdmin] = await connection.query(
                    'SELECT * FROM admin_tbl WHERE user_id = ?',
                    [userId]
                );
                
                if (existingAdmin.length === 0) {
                    // Create admin profile
                    await connection.query(
                        'INSERT INTO admin_tbl (user_id, department) VALUES (?, ?)',
                        [userId, 'Administration']
                    );
                    console.log('Admin profile created in admin_tbl');
                } else {
                    console.log('Admin profile already exists in admin_tbl');
                }
            } catch (error) {
                console.error('Error with admin_tbl:', error.message);
            }
        }
        
        if (adminTableNames.includes('admins_tbl')) {
            try {
                // Check if admin profile exists
                const [existingAdmin] = await connection.query(
                    'SELECT * FROM admins_tbl WHERE user_id = ?',
                    [userId]
                );
                
                if (existingAdmin.length === 0) {
                    // Create admin profile
                    await connection.query(
                        'INSERT INTO admins_tbl (user_id, department) VALUES (?, ?)',
                        [userId, 'Administration']
                    );
                    console.log('Admin profile created in admins_tbl');
                } else {
                    console.log('Admin profile already exists in admins_tbl');
                }
            } catch (error) {
                console.error('Error with admins_tbl:', error.message);
            }
        }
        
        console.log('Admin account is ready. You can now log in with:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await connection.end();
    }
}

// Run the function
createAdminUser()
    .then(() => {
        console.log('Done');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed:', err);
        process.exit(1);
    }); 