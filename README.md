# Internship Management System

A comprehensive web application for managing internships, connecting students with employers, and streamlining the internship process for educational institutions.

## Features

- **Student Portal**: Resume building, job applications, attendance tracking
- **Employer Portal**: Job posting, applicant management, intern evaluation
- **Admin Dashboard**: User management, archiving, attendance tracking, approval workflows
- **Faculty Module**: Internship monitoring and evaluation

## System Requirements

- Node.js (v14.0 or higher)
- MySQL (v5.7 or higher)
- Web browser (Chrome, Firefox, Edge recommended)
- Windows OS (for batch file options)

## Installation

### Prerequisites

1. Install [Node.js](https://nodejs.org/) (includes npm)
2. Install [MySQL](https://dev.mysql.com/downloads/mysql/)

### Database Setup

1. Create a MySQL database named `qcu_ims`
2. Import the database schema:
   ```
   mysql -u root -p qcu_ims < qcu_ims.sql
   ```
   Note: Replace `root` with your MySQL username if different

### Backend Setup

1. Navigate to the BackEnd directory
   ```
   cd BackEnd
   ```
2. Install dependencies
   ```
   npm install
   ```
3. Configure environment variables in the `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=root             # Replace with your MySQL username
   DB_PASSWORD=             # Add your MySQL password if any
   DB_NAME=qcu_ims
   PORT=5004
   JWT_SECRET=your-secret-key-here
   ```

### Admin Portal Setup

1. Navigate to the ADMINitona directory
   ```
   cd ADMINitona
   ```
2. No additional setup is required as this is a static frontend

## Running the Application

### Option 1: Using the Batch File (Recommended for Windows)

1. Double-click the `launch.bat` file in the root directory
2. The server will start in a new window and the application will open in your browser
3. Wait a few seconds for the server to fully initialize

### Option 2: Using PowerShell (Windows)

1. Right-click on `test-server.ps1` and select "Run with PowerShell"
2. Follow the prompts to test the server and start it if needed
3. Choose to open the application when prompted

### Option 3: Manual Start

#### Start the Backend Server:
1. Open a terminal/command prompt
2. Navigate to the BackEnd directory: `cd BackEnd`
3. Run the server: `node run.js`
4. Keep this terminal open while using the application

#### Open the Application:
1. Open the file `student/application-tracking.html` in your browser

## Login Information

### Admin Login
- Username: admin
- Password: admin123

## Application Structure

- **BackEnd/**: Contains the server-side Node.js/Express code
  - **src/**: Source code
    - **routes/**: API endpoints
    - **controllers/**: Request handlers
    - **middleware/**: Custom middleware
    - **config/**: Configuration files

- **ADMINitona/ADMIN/**: Admin portal interface
  - **Intrn.html/js/css**: Intern management
  - **Cmpny.html/js/css**: Company management
  - **Emplyr.html/js/css**: Employer management
  - **fclty.html/js/css**: Faculty management
  - **Archv.html/js/css**: Archive management
  - **AttendanceTracking.html/js/css**: Attendance tracking

## Key Features and Navigation

- **Intern Management**: View, add, edit, and archive interns
- **Company Management**: Manage partner companies and job listings
- **Employer Management**: Manage employer accounts
- **Faculty Management**: Manage faculty supervisors
- **Archive Management**: View, restore, or permanently delete archived records
- **Attendance Tracking**: Monitor intern attendance and working hours

## Troubleshooting

If you encounter issues with the application not connecting to the API:

1. Make sure the backend server is running (check for an open terminal window)
2. Check that the server is accessible by opening http://localhost:5004/api/status in your browser
3. If you see a 404 error, ensure you're running the server from the correct directory
4. If you see CORS errors in the browser console, ensure the server is properly configured

## Development Mode

The application is currently set to use mock data if the API is unavailable. To disable this:

1. Edit `student/scripts/applications.js`
2. Change `const DEVELOPMENT_MODE = true;` to `const DEVELOPMENT_MODE = false;`

## API Endpoints

- Status: http://localhost:5004/api/status
- Applications: http://localhost:5004/api/applications 
- Jobs: http://localhost:5004/api/jobs
- Cancel Application: http://localhost:5004/api/applications/{id}/withdraw

## Authentication

Some endpoints require authentication. To test with authentication:
1. Log in through the application interface
2. The token will be stored in localStorage
3. API requests will automatically include the token

## License

This project is part of a school assignment by SBIT-2E Group 2 in Software Engineering.
