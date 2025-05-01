@echo off
echo ======================================================
echo     INTERNSHIP MANAGEMENT SYSTEM - SIMPLE STARTUP    
echo ======================================================
echo.

rem Kill any processes on port 5004 (backend)
echo Killing any processes on port 5004...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5004') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)

rem Kill any processes on port 3000 (frontend)
echo Killing any processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)

rem Kill any node processes
echo Killing any node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul

rem Wait a moment
timeout /t 2 /nobreak > nul

echo.
echo Checking if XAMPP MySQL is running...
echo.

rem Create a .env file with default configuration for development
echo Creating .env file with database configuration...
echo.

echo # Database Configuration > BackEnd\.env
echo DB_HOST=localhost >> BackEnd\.env
echo DB_USER=root >> BackEnd\.env
echo DB_PASSWORD= >> BackEnd\.env
echo DB_NAME=qcu_ims >> BackEnd\.env
echo DB_PORT=3306 >> BackEnd\.env
echo. >> BackEnd\.env
echo # JWT Configuration >> BackEnd\.env
echo JWT_SECRET=internship-management-system-secret-key >> BackEnd\.env
echo TOKEN_EXPIRE=24h >> BackEnd\.env
echo. >> BackEnd\.env
echo # Server Configuration >> BackEnd\.env
echo PORT=5004 >> BackEnd\.env
echo NODE_ENV=development >> BackEnd\.env
echo USE_MOCK_DB=false >> BackEnd\.env

echo.
echo Installing backend dependencies...
cd /d "%~dp0BackEnd"
call npm install moment
call npm install
call npm install mysql2

echo.
echo Initializing database tables...
node init-db.js
if %ERRORLEVEL% NEQ 0 (
    echo Database initialization failed. Please check the output above.
    echo The application will continue but might not work correctly.
) else (
    echo Database initialized successfully.
)

rem Create a simple start.js script that doesn't use nodemon
echo // Simple startup script > start-server.js
echo const { spawn } = require('child_process'); >> start-server.js
echo const path = require('path'); >> start-server.js
echo. >> start-server.js
echo // Set environment variables >> start-server.js
echo process.env.NODE_ENV = 'development'; >> start-server.js
echo process.env.USE_MOCK_DB = 'false'; >> start-server.js
echo. >> start-server.js
echo // Start the app >> start-server.js
echo require('./src/app.js'); >> start-server.js

echo.
echo Setup is complete. Starting servers...
echo.

rem Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd /d "%~dp0BackEnd" & npm run dev"

rem Wait for backend to initialize (increased from 15 to 20 seconds)
echo Waiting for backend server to initialize... (15 seconds)
timeout /t 15 /nobreak > nul

rem Test if server is running with more detailed output
echo Testing backend server connection...
curl -s http://localhost:5004/api/status > test-output.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Failed to connect to backend server!
    echo.
    echo TROUBLESHOOTING:
    echo 1. Check the backend server window for errors
    echo 2. Make sure port 5004 is not blocked by a firewall
    echo 3. Ensure MySQL service is running in XAMPP
    echo.
    echo Please fix the backend issues before continuing.
    echo.
    echo Press any key to try starting the frontend anyway...
    pause > nul
) else (
    echo Backend server is running!
    type test-output.txt
    del test-output.txt
)

echo.
echo Starting frontend server...
echo.

rem Start frontend in a persistent window
start "Frontend Server" cmd /k "cd /d "%~dp0" & npm start"

echo.
echo ======================================================
echo     APPLICATION STARTUP COMPLETE                    
echo ======================================================
echo.
echo Backend API: http://localhost:5004
echo Frontend UI: http://localhost:3000 (should open automatically)
echo.
echo IMPORTANT: Keep both command windows open to maintain the servers.
echo Press any key to exit this window...
pause > nul 