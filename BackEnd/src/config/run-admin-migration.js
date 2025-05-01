const fs = require('fs');
const path = require('path');
const pool = require('./database');

/**
 * Run the admin tables migration script
 */
async function runAdminMigration() {
  try {
    console.log('Running admin tables migration...');
    
    const migrationPath = path.join(__dirname, '../../migrations/admin_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('Admin migration file not found at:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // First create the archived interns table
    try {
      const createArchivedTable = migrationSQL.match(/CREATE TABLE IF NOT EXISTS `archived_interns_tbl`[\s\S]*?ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/)[0];
      await pool.query(createArchivedTable);
      console.log('Created archived_interns_tbl (if it didn\'t exist)');
    } catch (error) {
      console.error('Error creating archived_interns_tbl:', error.message);
    }
    
    // Add is_deleted column to users_tbl
    try {
      await pool.query("ALTER TABLE `users_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0");
      console.log('Added is_deleted column to users_tbl (if it didn\'t exist)');
    } catch (error) {
      console.error('Error adding is_deleted to users_tbl:', error.message);
    }
    
    // Check and modify companies_tbl if it exists
    try {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies_tbl'");
      if (rows[0].count > 0) {
        await pool.query("ALTER TABLE `companies_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0");
        console.log('Added is_deleted column to companies_tbl (if it didn\'t exist)');
      } else {
        console.log('companies_tbl does not exist, skipping');
      }
    } catch (error) {
      console.error('Error checking/modifying companies_tbl:', error.message);
    }
    
    // Check and modify job_listings_tbl if it exists
    try {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'job_listings_tbl'");
      if (rows[0].count > 0) {
        await pool.query("ALTER TABLE `job_listings_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0");
        console.log('Added is_deleted column to job_listings_tbl (if it didn\'t exist)');
      } else {
        console.log('job_listings_tbl does not exist, skipping');
      }
    } catch (error) {
      console.error('Error checking/modifying job_listings_tbl:', error.message);
    }
    
    // Check and modify applications_tbl if it exists
    try {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'applications_tbl'");
      if (rows[0].count > 0) {
        await pool.query("ALTER TABLE `applications_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0");
        console.log('Added is_deleted column to applications_tbl (if it didn\'t exist)');
      } else {
        console.log('applications_tbl does not exist, skipping');
      }
    } catch (error) {
      console.error('Error checking/modifying applications_tbl:', error.message);
    }
    
    // Check and modify interns_tbl if it exists
    try {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'interns_tbl'");
      if (rows[0].count > 0) {
        await pool.query("ALTER TABLE `interns_tbl` ADD COLUMN IF NOT EXISTS `verification_status` ENUM('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending'");
        console.log('Added verification_status column to interns_tbl (if it didn\'t exist)');
      } else {
        console.log('interns_tbl does not exist, skipping');
      }
    } catch (error) {
      console.error('Error checking/modifying interns_tbl:', error.message);
    }
    
    // Create admin activity log table
    try {
      const createAdminLogTable = migrationSQL.match(/CREATE TABLE IF NOT EXISTS `admin_activity_log`[\s\S]*?ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/)[0];
      await pool.query(createAdminLogTable);
      console.log('Created admin_activity_log (if it didn\'t exist)');
    } catch (error) {
      console.error('Error creating admin_activity_log:', error.message);
    }
    
    console.log('Admin tables migration completed successfully.');
  } catch (error) {
    console.error('Error running admin migration:', error);
  }
}

module.exports = runAdminMigration; 