-- Create weekly report table
CREATE TABLE IF NOT EXISTS weekly_report_tbl (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    intern_id INT NOT NULL,
    company_id INT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    summary TEXT NOT NULL,
    key_learnings TEXT NOT NULL,
    goals_achieved TEXT,
    next_week_goals TEXT,
    supervisor_feedback TEXT,
    supervisor_approved BOOLEAN DEFAULT FALSE,
    faculty_feedback TEXT,
    faculty_approved BOOLEAN DEFAULT FALSE,
    status ENUM('Draft', 'Submitted', 'Supervisor Approved', 'Faculty Approved', 'Needs Revision') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intern_id) REFERENCES interns_tbl(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Create monthly report table
CREATE TABLE IF NOT EXISTS monthly_report_tbl (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    intern_id INT NOT NULL,
    company_id INT NOT NULL,
    month INT NOT NULL, -- 1-12 for January-December
    year INT NOT NULL,
    summary TEXT NOT NULL,
    projects_completed TEXT NOT NULL,
    major_achievements TEXT NOT NULL,
    challenges TEXT NOT NULL,
    skills_developed TEXT NOT NULL,
    overall_experience TEXT,
    supervisor_feedback TEXT,
    supervisor_approved BOOLEAN DEFAULT FALSE,
    faculty_feedback TEXT,
    faculty_approved BOOLEAN DEFAULT FALSE,
    status ENUM('Draft', 'Submitted', 'Supervisor Approved', 'Faculty Approved', 'Needs Revision') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intern_id) REFERENCES interns_tbl(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies_tbl(company_id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_report_dates ON weekly_report_tbl(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_report_intern ON weekly_report_tbl(intern_id);
CREATE INDEX IF NOT EXISTS idx_weekly_report_company ON weekly_report_tbl(company_id);
CREATE INDEX IF NOT EXISTS idx_weekly_report_status ON weekly_report_tbl(status);

CREATE INDEX IF NOT EXISTS idx_monthly_report_date ON monthly_report_tbl(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_report_intern ON monthly_report_tbl(intern_id);
CREATE INDEX IF NOT EXISTS idx_monthly_report_company ON monthly_report_tbl(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_report_status ON monthly_report_tbl(status); 