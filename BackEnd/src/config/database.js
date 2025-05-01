// Database configuration override 
const fs = require('fs'); 
const path = require('path'); 
require('dotenv').config(); 
 
// Check if we should use mock database 
const useMockDb = process.env.USE_MOCK_DB === 'true'; 
 
if (useMockDb) { 
  console.log('USING MOCK DATABASE FOR DEVELOPMENT'); 
  const mockDb = require('./mock-database'); 
  module.exports = mockDb; 
} else { 
  // Real database configuration 
  const mysql = require('mysql2/promise'); 
 
  // Database configuration with defaults
  const dbConfig = { 
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qcu_ims',
    waitForConnections: true, 
    connectionLimit: 10, 
    queueLimit: 0, 
    connectTimeout: 10000, 
    multipleStatements: true 
  }; 
 
  console.log('Database configuration:', { 
    host: dbConfig.host, 
    user: dbConfig.user, 
    database: dbConfig.database 
  }); 
 
  // Create a pool for connection management 
  let pool; 
 
  try { 
    pool = mysql.createPool(dbConfig); 
    console.log('Database connection pool created successfully'); 
  } catch (error) { 
    console.error('Error creating database connection pool:', error); 
  } 
 
  // Enhanced query function with better error handling 
  const query = async (sql, params) => {
    try { 
      if (!pool) { 
        throw new Error('Database connection pool not initialized'); 
      } 
 
      const [results] = await pool.query(sql, params); 
      return [results]; 
    } catch (error) { 
      console.error('Database query error:', { 
        error: error.message,
        sql: sql
      }); 
      throw error; 
    } 
  }; 
 
  // Transaction methods 
  const beginTransaction = async () => {
    if (!pool) { 
      throw new Error('Database connection pool not initialized'); 
    } 
 
    const connection = await pool.getConnection(); 
    await connection.beginTransaction(); 
    return connection; 
  }; 
 
  const commit = async (connection) => {
    await connection.commit(); 
    connection.release(); 
  }; 
 
  const rollback = async (connection) => {
    await connection.rollback(); 
    connection.release(); 
  }; 
 
  module.exports = { 
    query, 
    beginTransaction, 
    commit, 
    rollback 
  }; 
} 
