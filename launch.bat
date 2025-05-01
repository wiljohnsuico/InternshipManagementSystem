@echo off
echo Starting Internship Management System...

REM Start the backend server in a new window
start "Backend Server" cmd /k "cd BackEnd && node run.js"

REM Wait for the server to initialize
echo Waiting for server to initialize...
timeout /t 5 /nobreak > nul

REM Open the application in browser
echo Opening application in browser...
start "" "%~dp0student\application-tracking.html"

echo Application started! You can close this window when done. 