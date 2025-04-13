const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims'
    });

    try {
        // Disable foreign key checks temporarily
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // Drop existing tables if they exist (in correct order - child tables first)
        await connection.query('DROP TABLE IF EXISTS interns_tbl');
        await connection.query('DROP TABLE IF EXISTS employers_tbl');
        await connection.query('DROP TABLE IF EXISTS faculties_tbl');
        await connection.query('DROP TABLE IF EXISTS admin_tbl');
        await connection.query('DROP TABLE IF EXISTS users_tbl');
        
        console.log('Old tables dropped successfully');

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled');

        // Create users_tbl with correct schema
        await connection.query(`
            CREATE TABLE users_tbl (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                user_role ENUM('Intern', 'Employer', 'Faculty', 'Admin') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('users_tbl created successfully');

        // Create interns_tbl
        await connection.query(`
            CREATE TABLE interns_tbl (
                intern_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                student_id VARCHAR(20) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                year_level VARCHAR(50),
                section VARCHAR(50),
                dept VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
            )
        `);
        console.log('interns_tbl created successfully');

        // Create employers_tbl
        await connection.query(`
            CREATE TABLE employers_tbl (
                employer_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                company_name VARCHAR(255),
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
            )
        `);
        console.log('employers_tbl created successfully');

        // Create faculties_tbl
        await connection.query(`
            CREATE TABLE faculties_tbl (
                faculty_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                dept VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
            )
        `);
        console.log('faculties_tbl created successfully');

        // Create admin_tbl
        await connection.query(`
            CREATE TABLE admin_tbl (
                admin_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
            )
        `);
        console.log('admin_tbl created successfully');

        console.log('Database schema fixed successfully!');
    } catch (error) {
        console.error('Error fixing database:', error);
        // Re-enable foreign key checks in case of error
        await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(console.error);
    } finally {
        await connection.end();
    }
}

fixDatabase(); 