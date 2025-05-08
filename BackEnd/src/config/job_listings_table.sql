-- Job Listings Table Creation Script
-- This script creates the job_listings_tbl if it doesn't exist

-- Check if job_listings_tbl exists, create if not
CREATE TABLE IF NOT EXISTS `job_listings_tbl` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `company_id` INT NOT NULL,
  `company_name` VARCHAR(255),
  `description` TEXT,
  `requirements` TEXT,
  `location` VARCHAR(255),
  `salary` VARCHAR(100),
  `is_paid` BOOLEAN DEFAULT TRUE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `status` ENUM('Active', 'Inactive', 'Filled', 'Closed', 'Draft') DEFAULT 'Active',
  `job_type` ENUM('Full-time', 'Part-time', 'Remote', 'Hybrid', 'On-site') DEFAULT 'On-site',
  `positions_available` INT DEFAULT 1,
  `application_deadline` DATE,
  `start_date` DATE,
  `duration` VARCHAR(100),
  `skills_required` TEXT,
  `qualification` TEXT,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT,
  INDEX `idx_company_id` (`company_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Foreign key constraint removed to prevent creation errors
-- If needed, add the constraint manually after ensuring companies_tbl exists 