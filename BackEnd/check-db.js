/**
 * Script to check interns_tbl structure
 */

const pool = require('./src/config/database');

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Check interns_tbl structure
    console.log('\nDescribing interns_tbl:');
    const [internsStructure] = await pool.query('DESCRIBE interns_tbl');
    console.log(internsStructure);
    
    // Get sample data from interns_tbl
    console.log('\nSample data from interns_tbl:');
    const [internsSample] = await pool.query('SELECT * FROM interns_tbl LIMIT 1');
    console.log('Column names:', Object.keys(internsSample[0] || {}));
    console.log('Sample record:', internsSample[0]);
    
    // Check the primary key column of interns_tbl
    console.log('\nChecking primary key for interns_tbl:');
    const [primaryKeys] = await pool.query('SHOW KEYS FROM interns_tbl WHERE Key_name = "PRIMARY"');
    console.log('Primary key column:', primaryKeys.map(key => key.Column_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase(); 