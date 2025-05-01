@echo off
echo ======================================================
echo     INTERNSHIP MANAGEMENT SYSTEM - STOPPING SERVERS    
echo ======================================================
echo.

rem Kill any processes on port 5004
echo Killing any processes on port 5004...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5004') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)

rem Kill any processes on other potential ports
echo Killing any processes on alternative ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5005') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5006') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)

rem Kill any processes on port 3000
echo Killing any processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)

rem Kill any node processes
echo Killing any node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul

echo.
echo ======================================================
echo     ALL SERVERS STOPPED
echo ======================================================
echo.
echo You can now start the application again with start-simple.bat
echo.
echo Press any key to exit...
pause > nul 