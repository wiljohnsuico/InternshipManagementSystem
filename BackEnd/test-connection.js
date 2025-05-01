/**
 * Test script to verify connectivity to the MySQL database and API
 * Use: node test-connection.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  
  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qcu_ims',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 10000
  };
  
  console.log('Database configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database
  });
  
  try {
    // Create a connection pool
    console.log('Creating connection pool...');
    const pool = mysql.createPool(dbConfig);
    
    // Get a connection from the pool
    console.log('Getting connection from pool...');
    const connection = await pool.getConnection();
    console.log('Connection obtained successfully');
    
    // Test with a simple query
    console.log('Executing test query...');
    const [rows] = await connection.query('SHOW TABLES');
    console.log(`Database tables found: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('Tables:');
      rows.forEach(row => {
        console.log(`- ${Object.values(row)[0]}`);
      });
      
      // Check users table if it exists
      const tableNames = rows.map(row => Object.values(row)[0]);
      if (tableNames.includes('users_tbl')) {
        const [users] = await connection.query('SELECT user_id, email, role FROM users_tbl LIMIT 5');
        console.log(`\nUsers in database: ${users.length}`);
        users.forEach(user => {
          console.log(`- User ID: ${user.user_id}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    }
    
    // Release connection
    connection.release();
    console.log('Connection released');
    
    console.log('\n✅ Database connection successful');
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nCredentials error: Check your username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused: Make sure MySQL server is running on the specified host and port');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nDatabase does not exist: Create the database first');
    }
  }
}

// Function to test API server status
async function testApiConnection() {
  console.log('\n=== Testing API Connection ===');
  try {
    console.log('Testing connection to API status endpoint...');
    const response = await fetch('http://localhost:5004/api/status');
    const data = await response.json();
    
    console.log('API status response:', data);
    console.log('✅ API connection successful');
    
    console.log('\nTesting connection to auth endpoint...');
    const testData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const authResponse = await fetch('http://localhost:5004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Auth endpoint HTTP status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Auth endpoint response:', {
      ...authData,
      token: authData.token ? '[TOKEN HIDDEN]' : undefined
    });
    
  } catch (error) {
    console.error('\n❌ API connection test failed:');
    console.error('Error details:', error);
  }
}

// Run tests
async function runTests() {
  try {
    console.log('=== Connection Test Script ===');
    console.log('Testing connectivity to database and API');
    
    await testDatabaseConnection();
    await testApiConnection();
    
    console.log('\n=== Tests Complete ===');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests(); 