/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and verifies that the job_listings_tbl exists.
 * It also creates a sample job listing to test the table.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qcu_ims',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 10000,
    multipleStatements: true
};

console.log('Database configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database
});

async function testDatabaseConnection() {
    let connection;
    try {
        console.log('Attempting to connect to the database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database successfully!');

        // Check if job_listings_tbl exists
        const [tables] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = ? AND table_name = 'job_listings_tbl'
        `, [dbConfig.database]);

        if (tables.length === 0) {
            console.log('⚠️ job_listings_tbl does not exist. Creating it...');
            
            // Create the job_listings_tbl
            await connection.query(`
                CREATE TABLE IF NOT EXISTS job_listings_tbl (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    company_id INT NOT NULL,
                    company_name VARCHAR(255),
                    description TEXT,
                    requirements TEXT,
                    location VARCHAR(255),
                    salary VARCHAR(100),
                    is_paid BOOLEAN DEFAULT TRUE,
                    is_active BOOLEAN DEFAULT TRUE,
                    status ENUM('Active', 'Inactive', 'Filled', 'Closed', 'Draft') DEFAULT 'Active',
                    job_type ENUM('Full-time', 'Part-time', 'Remote', 'Hybrid', 'On-site') DEFAULT 'On-site',
                    positions_available INT DEFAULT 1,
                    application_deadline DATE,
                    start_date DATE,
                    duration VARCHAR(100),
                    skills_required TEXT,
                    qualification TEXT,
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    created_by INT,
                    INDEX idx_company_id (company_id),
                    INDEX idx_status (status),
                    INDEX idx_is_active (is_active),
                    INDEX idx_is_deleted (is_deleted)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Created job_listings_tbl successfully!');
        } else {
            console.log('✅ job_listings_tbl exists!');
        }

        // Check if the table has any records
        const [jobCount] = await connection.query('SELECT COUNT(*) as count FROM job_listings_tbl');
        console.log(`Found ${jobCount[0].count} job listings in the database.`);

        if (jobCount[0].count === 0) {
            console.log('⚠️ No job listings found. Creating a sample job listing...');
            
            // Add a sample job listing
            await connection.query(`
                INSERT INTO job_listings_tbl (
                    title, company_id, company_name, description, requirements, location, 
                    salary, is_paid, status, job_type, positions_available, skills_required
                ) VALUES (
                    'Sample Frontend Developer Intern', 
                    1, 
                    'Example Company', 
                    'This is a sample job listing for testing purposes.', 
                    'HTML, CSS, JavaScript', 
                    'Manila, Philippines',
                    '₱15,000 - ₱20,000',
                    true,
                    'Active',
                    'On-site',
                    2,
                    'React, TypeScript, HTML, CSS'
                )
            `);
            console.log('✅ Created sample job listing successfully!');
        }

        // Verify job listings can be retrieved
        const [jobs] = await connection.query('SELECT * FROM job_listings_tbl');
        console.log(`Retrieved ${jobs.length} job listings from the database:`);
        jobs.forEach((job, index) => {
            console.log(`${index + 1}. ${job.title} (ID: ${job.id})`);
        });

        // Test if employer dashboard queries work
        console.log('Testing employer dashboard queries...');
        const [activeJobs] = await connection.query(
            'SELECT COUNT(*) as count FROM job_listings_tbl WHERE is_active = TRUE AND is_deleted = FALSE'
        );
        console.log(`Active jobs count: ${activeJobs[0].count}`);

        console.log('✅ All database tests completed successfully!');
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

testDatabaseConnection().then(() => {
    console.log('Database connection test completed.');
}).catch(error => {
    console.error('Unexpected error during database test:', error);
}); 