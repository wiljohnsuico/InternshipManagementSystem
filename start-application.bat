@echo off
echo Starting Internship Management System...
echo This script will start the backend server and open the application in your browser.
echo.

REM Check if backend server is already running
echo Checking if backend server is already running...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:5004/api/status
if NOT %ERRORLEVEL% == 0 (
    echo Backend server is not running or responding.
) else (
    echo Backend server is already running!
)

REM Start backend server
echo Starting backend server...
cd BackEnd
start "Backend Server" cmd /c "node server.js"
cd ..

REM Wait for server to initialize
echo Waiting for server to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

REM Check if server is running successfully
echo Checking if server started successfully...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:5004/api/status
if %ERRORLEVEL% == 0 (
    echo Backend server started successfully!
) else (
    echo Failed to connect to backend server. Please check for errors.
)

REM Open application in browser
echo Opening application in browser...
start "" "student/application-tracking.html"

echo.
echo If the application doesn't load correctly, please refresh the page after a few seconds.
echo You can close this window once you're finished using the application.
pause 