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
    connectTimeout: 15000, // Extended timeout
    multipleStatements: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000 // Keep connection alive
  }; 
 
  console.log('Database configuration:', { 
    host: dbConfig.host, 
    user: dbConfig.user, 
    database: dbConfig.database 
  }); 
 
  // Create a pool for connection management 
  let pool;
  let isConnected = false;
  let reconnectTimer = null;
 
  function createPool() {
    try { 
      pool = mysql.createPool(dbConfig);
      console.log('Database connection pool created successfully');
      
      // Test the connection
      testConnection();
      
      return pool;
    } catch (error) { 
      console.error('Error creating database connection pool:', error);
      scheduleReconnect();
      return null;
    }
  }
  
  async function testConnection() {
    try {
      const connection = await pool.getConnection();
      console.log('Successfully connected to database');
      isConnected = true;
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      isConnected = false;
      scheduleReconnect();
      return false;
    }
  }
  
  function scheduleReconnect() {
    if (reconnectTimer) return;
    
    console.log('Scheduling database reconnection attempt in 5 seconds...');
    reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect to database...');
      reconnectTimer = null;
      createPool();
    }, 5000);
  }
  
  // Initial pool creation
  createPool();
 
  // Enhanced query function with better error handling and retry
  const query = async (sql, params, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      if (!pool) {
        createPool();
        if (!pool) {
          throw new Error('Database connection pool not initialized');
        }
      }
 
      const [results] = await pool.query(sql, params);
      isConnected = true;
      return [results];
    } catch (error) {
      console.error('Database query error:', { 
        error: error.message,
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        retryCount
      });
      
      // Check for connection errors that might require reconnection
      if (
        error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ER_CON_COUNT_ERROR'
      ) {
        isConnected = false;
        
        // Try to recreate the pool if needed
        if (retryCount < MAX_RETRIES) {
          console.log(`Attempting query retry ${retryCount + 1}/${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          createPool();
          return query(sql, params, retryCount + 1);
        }
      }
      
      throw error;
    } 
  }; 
 
  // Transaction methods with improved error handling
  const beginTransaction = async () => {
    if (!pool) { 
      createPool();
      if (!pool) {
        throw new Error('Database connection pool not initialized'); 
      }
    } 
 
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      return connection;
    } catch (error) {
      console.error('Failed to begin transaction:', error);
      throw error;
    }
  }; 
 
  const commit = async (connection) => {
    try {
      await connection.commit();
      connection.release();
    } catch (error) {
      console.error('Failed to commit transaction:', error);
      // Attempt to rollback on commit failure
      try {
        await connection.rollback();
      } catch (e) {
        console.error('Failed to rollback after commit failure:', e);
      }
      connection.release();
      throw error;
    }
  }; 
 
  const rollback = async (connection) => {
    try {
      await connection.rollback();
      connection.release();
    } catch (error) {
      console.error('Failed to rollback transaction:', error);
      connection.release();
      throw error;
    }
  }; 
  
  // Function to check connection status
  const isDbConnected = async () => {
    if (!isConnected) {
      await testConnection();
    }
    return isConnected;
  };
 
  module.exports = { 
    query,
    beginTransaction, 
    commit, 
    rollback,
    isDbConnected,
    testConnection
  }; 
} 
