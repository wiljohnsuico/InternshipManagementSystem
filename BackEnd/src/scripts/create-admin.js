const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser(email, password, firstName, lastName) {
    // Custom admin credentials
    const adminEmail = email;
    const adminPassword = password;
    const adminFirstName = firstName;
    const adminLastName = lastName;
    
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
                [adminFirstName, adminLastName, hashedPassword, 'Admin', adminEmail]
            );
            
            console.log('User credentials and role updated successfully.');
        } else {
            console.log('Creating new admin user...');
            
            // Create new admin user
            const [result] = await connection.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role, contact_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [adminFirstName, adminLastName, adminEmail, hashedPassword, 'Admin', '1234567890']
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
        
        return {
            email: adminEmail,
            password: adminPassword,
            firstName: adminFirstName,
            lastName: adminLastName
        };
    } catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Process command line arguments
const args = process.argv.slice(2);

// Default values
const defaultEmail = 'admin@qcuims.com';
const defaultPassword = 'admin123';
const defaultFirstName = 'System';
const defaultLastName = 'Administrator';

// Extract arguments
const email = args[0] || defaultEmail;
const password = args[1] || defaultPassword;
const firstName = args[2] || defaultFirstName;
const lastName = args[3] || defaultLastName;

// Run the function
createAdminUser(email, password, firstName, lastName)
    .then((admin) => {
        console.log('Done creating admin:');
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${admin.password}`);
        console.log(`Name: ${admin.firstName} ${admin.lastName}`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed:', err);
        process.exit(1);
    }); 