/**
 * Script to check archived_interns_tbl structure
 */

const pool = require('./src/config/database');

async function checkArchivedTable() {
  try {
    console.log('Connecting to database...');
    
    // Check if table exists
    const [tables] = await pool.query('SHOW TABLES LIKE "archived_interns_tbl"');
    if (tables.length === 0) {
      console.log('archived_interns_tbl does not exist');
      process.exit(0);
    }
    
    // Check archived_interns_tbl structure
    console.log('\nDescribing archived_interns_tbl:');
    const [tableStructure] = await pool.query('DESCRIBE archived_interns_tbl');
    console.log(tableStructure);
    
    // Get sample data from archived_interns_tbl
    console.log('\nSample data from archived_interns_tbl:');
    const [archiveSample] = await pool.query('SELECT * FROM archived_interns_tbl LIMIT 1');
    
    if (archiveSample.length > 0) {
      console.log('Column names:', Object.keys(archiveSample[0] || {}));
      console.log('Sample record:', archiveSample[0]);
    } else {
      console.log('No records found in archived_interns_tbl');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkArchivedTable(); 