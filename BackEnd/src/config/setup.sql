-- Disable FK checks temporarily (not needed unless altering schema)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS daily_accomplishment_tbl;
DROP TABLE IF EXISTS attendance_tracking_tbl;
DROP TABLE IF EXISTS internship_placements_tbl;
DROP TABLE IF EXISTS interns_tbl;
DROP TABLE IF EXISTS employers_tbl;
DROP TABLE IF EXISTS faculties_tbl;
DROP TABLE IF EXISTS admin_tbl;
DROP TABLE IF EXISTS users_tbl;
DROP TABLE IF EXISTS companies_tbl;
DROP TABLE IF EXISTS resumes;
SET FOREIGN_KEY_CHECKS = 1;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users_tbl (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Faculty', 'Employer', 'Intern') NOT NULL,
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies_tbl (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    industry_sector VARCHAR(100),
    company_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create interns table if it doesn't exist
CREATE TABLE IF NOT EXISTS interns_tbl (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(20) UNIQUE,
    course VARCHAR(100),
    year_level INT,
    section VARCHAR(20),
    dept VARCHAR(100),
    age INT,
    address TEXT,
    about TEXT,
    skills JSON DEFAULT '[]',
    website VARCHAR(255),
    social_links JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
);

-- Create employers table if it doesn't exist
CREATE TABLE IF NOT EXISTS employers_tbl (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    company_id INT NOT NULL,
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Create faculty table if it doesn't exist
CREATE TABLE IF NOT EXISTS faculties_tbl (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
);

-- Create admin table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_tbl (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
);

-- Create internship placements table if it doesn't exist
CREATE TABLE IF NOT EXISTS internship_placements_tbl (
    placement_id INT PRIMARY KEY AUTO_INCREMENT,
    intern_id INT NOT NULL,
    company_id INT NOT NULL,
    start_date DATE,
    end_date DATE,
    department VARCHAR(100),
    supervisor_name VARCHAR(100),
    supervisor_contact_number VARCHAR(20),
    supervisor_email VARCHAR(255),
    placement_status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    placement_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intern_id) REFERENCES interns_tbl(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Create daily accomplishment table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_accomplishment_tbl (
    accomplishment_id INT PRIMARY KEY AUTO_INCREMENT,
    intern_id INT NOT NULL,
    company_id INT NOT NULL,
    date DATE NOT NULL,
    task_completed TEXT NOT NULL,
    challenges_faced TEXT,
    skills_applied TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intern_id) REFERENCES interns_tbl(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Create attendance tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_tracking_tbl (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    intern_id INT NOT NULL,
    company_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME,
    duration DECIMAL(4,2),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intern_id) REFERENCES interns_tbl(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Create resumes table if it doesn't exist
CREATE TABLE IF NOT EXISTS resumes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    basic JSON DEFAULT '{}',
    education JSON DEFAULT '[]',
    skills JSON DEFAULT '[]',
    image_data MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
);

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_role ON users_tbl(role);
CREATE INDEX IF NOT EXISTS idx_intern_user ON interns_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_user ON employers_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user ON faculties_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user ON admin_tbl(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_status ON internship_placements_tbl(placement_status);
CREATE INDEX IF NOT EXISTS idx_accomplishment_date ON daily_accomplishment_tbl(date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_tracking_tbl(date);
