@echo on 
echo ======================================================== 
echo Starting backend server - DO NOT CLOSE THIS WINDOW 
echo ======================================================== 
echo. 
echo Using MySQL database... 
echo. 
echo Starting backend server... 
echo Press Ctrl+C to stop the server 
echo. 
set NODE_ENV=development 
set USE_MOCK_DB=false 
node start-server.js 
echo. 
echo If the server stopped unexpectedly, check for these common issues: 
echo 1. Port 5004 might already be in use 
echo 2. Missing node modules (try npm install) 
echo 3. Check that MySQL is running in XAMPP 
echo. 
echo Press any key to exit... 
pause 
