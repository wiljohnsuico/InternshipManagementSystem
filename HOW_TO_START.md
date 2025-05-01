# How to Start/Stop the Internship Management System

## 🚀 Quick Start (Recommended)

### Option 1: Use the Simple Batch Files (Easiest)
These don't require PowerShell and work on any Windows system:

1. Double-click on `start-simple.bat` to start the application
2. When done, double-click on `stop-simple.bat` to stop the application

### Option 2: Use Regular Batch Files
1. Double-click on `start.bat` to start the application
2. When done, double-click on `stop.bat` to stop the application

### Option 3: Use PowerShell Scripts
1. Right-click on `start-all.ps1` and select "Run with PowerShell"
2. When done, right-click on `stop-all.ps1` and select "Run with PowerShell"

## 🛑 Troubleshooting

If the application doesn't start properly:

1. First, run `stop-simple.bat` to clean up any running processes
2. Try again with `start-simple.bat`

If you still have issues:

1. Open Command Prompt as Administrator
2. Run: `taskkill /F /IM node.exe` to kill all Node.js processes
3. Run: `netstat -ano | findstr :5004` to find processes using port 5004
4. For each process ID shown, run: `taskkill /F /PID [ID]` (replace [ID] with the number)
5. Try starting again

## 🌐 Accessing the Application

- Backend API: http://localhost:5004
- Frontend UI: http://localhost:3000 (should open automatically)

## 📋 Important Notes

- The server might try different ports (5004, 5005, 5006, etc.) if the default port is busy
- Log files are saved in `BackEnd/server.log` for troubleshooting
- Always use the stop scripts when you're done to properly clean up processes 