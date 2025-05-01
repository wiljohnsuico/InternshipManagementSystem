@echo off
echo Starting Internship Management System Backend Server...
echo.

cd BackEnd
echo Current directory: %CD%
echo.

echo Testing connection to backend server...
curl -s -o nul -w "%%{http_code}\n" http://localhost:5004/api/status
if %ERRORLEVEL% NEQ 0 (
    echo Backend server is not running, starting it now...
    start /B node start-server.js
    timeout /t 5
    echo Server should be running now at http://localhost:5004
) else (
    echo Backend server is already running!
)

echo.
echo You can now open the application in your browser.
echo Press any key to exit...
pause > nul 