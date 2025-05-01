-- SQL script to update the companies_tbl and employers_tbl tables

-- First, check if the companies_tbl already exists and add any missing columns
ALTER TABLE companies_tbl
ADD COLUMN IF NOT EXISTS company_location VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS company_website VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS founded_year YEAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255) DEFAULT NULL;

-- Update employers_tbl to ensure it has the necessary columns
ALTER TABLE employers_tbl
ADD COLUMN IF NOT EXISTS position VARCHAR(100) DEFAULT NULL;

-- Add index for user_id in employers_tbl if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_id ON employers_tbl(user_id);

-- Add index for company_id in employers_tbl if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_company_id ON employers_tbl(company_id);

-- Simple alter table to add the id column if needed (application will handle this check)
-- ALTER TABLE employers_tbl ADD COLUMN id INT PRIMARY KEY AUTO_INCREMENT;

-- Create trigger for companies_tbl if it doesn't exist
DROP TRIGGER IF EXISTS companies_update_timestamps;

CREATE TRIGGER companies_update_timestamps
BEFORE UPDATE ON companies_tbl
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;

-- Create trigger for employers_tbl if it doesn't exist
DROP TRIGGER IF EXISTS employers_update_timestamps;

CREATE TRIGGER employers_update_timestamps
BEFORE UPDATE ON employers_tbl
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP; 