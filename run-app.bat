@echo off
echo Launching Internship Management System...
echo.

REM Go to BackEnd directory
cd BackEnd

REM Start the server
echo Starting the backend server...
start "Backend Server" cmd /c "node run.js"

REM Wait for the server to initialize
echo Waiting for server to initialize...
timeout /t 5 /nobreak > nul

REM Go back to main directory
cd ..

REM Open the application in browser
echo Opening application in browser...
start "" "student/application-tracking.html"

echo.
echo Application launched! If it doesn't work, please try again in a few seconds.
echo You can close this window now. 