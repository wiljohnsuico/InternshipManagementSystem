-- Create interns_tbl if it doesn't exist
CREATE TABLE IF NOT EXISTS interns_tbl (
    user_id INT PRIMARY KEY,
    course VARCHAR(100),
    age INT,
    address TEXT,
    about TEXT,
    skills JSON,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
);

-- Add columns if they don't exist
ALTER TABLE interns_tbl
ADD COLUMN IF NOT EXISTS course VARCHAR(100),
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS skills JSON,
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Update existing columns if needed
ALTER TABLE interns_tbl
MODIFY COLUMN course VARCHAR(100),
MODIFY COLUMN age INT,
MODIFY COLUMN address TEXT,
MODIFY COLUMN about TEXT,
MODIFY COLUMN skills JSON,
MODIFY COLUMN website VARCHAR(255); 