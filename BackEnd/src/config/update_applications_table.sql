-- Add missing columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS additional_info JSON,
ADD COLUMN IF NOT EXISTS file_info JSON; 