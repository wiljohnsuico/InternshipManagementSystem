-- Admin Tables Migration
-- Run this after the core tables have been created

-- Create the archived_interns_tbl to store deleted interns
CREATE TABLE IF NOT EXISTS `archived_interns_tbl` (
  `archive_id` INT NOT NULL AUTO_INCREMENT,
  `original_intern_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `student_id` VARCHAR(20) NULL,
  `department` VARCHAR(255) NULL,
  `course` VARCHAR(255) NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `archived_by` INT NOT NULL COMMENT 'admin user_id who archived this intern',
  `archived_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL,
  PRIMARY KEY (`archive_id`),
  INDEX `idx_original_intern_id` (`original_intern_id`),
  INDEX `idx_archived_date` (`archived_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add is_deleted column to tables if they exist
-- For users_tbl (should already exist)
ALTER TABLE `users_tbl` 
ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0;

-- For companies_tbl (check if exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies_tbl');
SET @sql = IF(@table_exists > 0, 'ALTER TABLE `companies_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For job_listings_tbl (check if exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'job_listings_tbl');
SET @sql = IF(@table_exists > 0, 'ALTER TABLE `job_listings_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For applications_tbl (check if exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'applications_tbl');
SET @sql = IF(@table_exists > 0, 'ALTER TABLE `applications_tbl` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add verification_status column to interns_tbl if not already exists
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'interns_tbl');
SET @sql = IF(@table_exists > 0, 'ALTER TABLE `interns_tbl` ADD COLUMN IF NOT EXISTS `verification_status` ENUM(\'Pending\', \'Accepted\', \'Rejected\') NOT NULL DEFAULT \'Pending\'', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS `admin_activity_log` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `activity_type` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `target_entity` VARCHAR(50) NULL,
  `target_id` INT NULL,
  `ip_address` VARCHAR(45) NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_activity_type` (`activity_type`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 