const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    // Create connection without database selected
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'qcu_ims'}`);
        console.log('Database created or already exists');

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME || 'qcu_ims'}`);

        // Create users_tbl
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users_tbl (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('Intern', 'Employer', 'Faculty', 'Admin') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('users_tbl created or already exists');

        // Create interns_tbl
        await connection.query(`
            CREATE TABLE IF NOT EXISTS interns_tbl (
                intern_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                email VARCHAR(255),
                last_name VARCHAR(100),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                year_level VARCHAR(50),
                section VARCHAR(50),
                dept VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
            )
        `);
        console.log('interns_tbl created or already exists');

        // Create employers_tbl
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employers_tbl (
                employer_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                email VARCHAR(255),
                last_name VARCHAR(100),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
            )
        `);
        console.log('employers_tbl created or already exists');

        // Create faculties_tbl
        await connection.query(`
            CREATE TABLE IF NOT EXISTS faculties_tbl (
                faculty_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                email VARCHAR(255),
                last_name VARCHAR(100),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                dept VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
            )
        `);
        console.log('faculties_tbl created or already exists');

        // Create admin_tbl
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_tbl (
                admin_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                email VARCHAR(255),
                last_name VARCHAR(100),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
            )
        `);
        console.log('admin_tbl created or already exists');

        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await connection.end();
    }
}

setupDatabase(); 