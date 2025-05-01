// Database initialization script
require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  try {
    // First, create the database if it doesn't exist
    const connection = await mysql.createConnection(config);
    
    console.log('Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'qcu_ims'}`);
    console.log(`Database ${process.env.DB_NAME || 'qcu_ims'} created or already exists`);
    
    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME || 'qcu_ims'}`);
    
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role ENUM('admin', 'student', 'employer', 'coordinator') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS employers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company_name VARCHAR(100) NOT NULL,
        industry VARCHAR(50),
        address TEXT,
        phone VARCHAR(20),
        website VARCHAR(100),
        description TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        student_id VARCHAR(20) UNIQUE,
        program VARCHAR(100),
        year_level INT,
        gpa DECIMAL(3,2),
        resume_url TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employer_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT,
        location VARCHAR(100),
        salary VARCHAR(50),
        job_type ENUM('full-time', 'part-time', 'contract', 'internship') DEFAULT 'internship',
        status ENUM('open', 'closed', 'filled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        student_id INT NOT NULL,
        cover_letter TEXT,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );
    `);
    
    console.log('Tables created or already exist');
    
    // Insert demo user
    const hasAdminUser = await connection.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (hasAdminUser[0].length === 0) {
      await connection.query(`
        INSERT INTO users (username, password, email, role) 
        VALUES ('admin', '$2b$10$mLtMg.vQRQmL6vA0o3vI5OLBGXnvcZrjF6vHvE4xW2HnEd06Ke5sa', 'admin@example.com', 'admin')
      `);
      console.log('Demo admin user created (Username: admin, Password: admin123)');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Database initialization complete');
    
    // Close the connection
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Run the initialization
initializeDatabase()
  .then(success => {
    if (success) {
      console.log('Database setup complete');
      process.exit(0);
    } else {
      console.error('Database setup failed');
      process.exit(1);
    }
  }); 