/**
 * Script to run database schema update SQL
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');

async function runSchemaUpdate() {
  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    multipleStatements: true
  });

  try {
    console.log('Connected to the database. Running schema updates...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .replace(/--.*$|\/\*[\s\S]*?\*\//gm, '') // Remove comments
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.execute(statement);
        console.log(`Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}/${statements.length}:`, error.message);
        console.log('Statement:', statement);
        // Continue with the next statement
      }
    }
    
    console.log('Schema update completed successfully.');
  } catch (error) {
    console.error('Error during schema update:', error.message);
  } finally {
    // Close the connection
    await connection.end();
    console.log('Database connection closed.');
  }
}

module.exports = runSchemaUpdate; 