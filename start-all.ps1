# Master script to clean up processes and start the application
# Run this script as administrator for best results

$ErrorActionPreference = "Stop"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   INTERNSHIP MANAGEMENT SYSTEM - AUTOMATIC STARTUP   " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Function to kill processes on a specific port
function Kill-ProcessOnPort {
    param(
        [int]$Port
    )
    
    Write-Host "Looking for processes using port $Port..." -ForegroundColor Yellow
    
    # Find process using the port
    $connections = netstat -ano | findstr ":$Port"
    if ($connections) {
        Write-Host ("Found processes using port " + $Port + ":") -ForegroundColor Yellow
        $connections
        
        # Extract PIDs
        $pids = @()
        foreach ($line in $connections) {
            if ($line -match '(\d+)$') {
                $pids += $matches[1]
            }
        }
        
        $pids = $pids | Select-Object -Unique
        
        if ($pids.Count -gt 0) {
            Write-Host ("Killing processes with PIDs: " + ($pids -join ', ')) -ForegroundColor Red
            foreach ($pid in $pids) {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "  - Killed process with PID: $pid" -ForegroundColor Green
                } catch {
                    Write-Host "  - Failed to kill process with PID: $pid" -ForegroundColor Red
                }
            }
            
            # Give processes time to shut down
            Start-Sleep -Seconds 2
            
            # Double-check if port is free
            $check = netstat -ano | findstr ":$Port"
            if ($check) {
                Write-Host "WARNING: Port $Port is still in use! Trying system commands..." -ForegroundColor Red
                # Use more aggressive command
                taskkill /F /PID $pids
                Start-Sleep -Seconds 1
            }
        }
    } else {
        Write-Host "No processes found using port $Port" -ForegroundColor Green
    }
}

# Step 1: Kill all existing node processes
Write-Host "`n[STEP 1] Cleaning up existing processes..." -ForegroundColor Magenta

# Check for Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, Path -AutoSize
    
    Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force
            Write-Host "  - Killed process ID: $($process.Id)" -ForegroundColor Green
        } catch {
            Write-Host "  - Failed to kill process ID: $($process.Id)" -ForegroundColor Red
        }
    }
    
    # Wait for processes to stop
    Start-Sleep -Seconds 2
} else {
    Write-Host "No Node.js processes found running" -ForegroundColor Green
}

# Kill processes on specific ports we need
Kill-ProcessOnPort -Port 5004
Kill-ProcessOnPort -Port 3000

# Step 2: Start backend server
Write-Host "`n[STEP 2] Starting backend server..." -ForegroundColor Magenta

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\BackEnd"

# Start backend server (directly using node to avoid nodemon)
$backendProcess = Start-Process -FilePath "node" -ArgumentList ".\start-server.js" -PassThru -NoNewWindow -RedirectStandardOutput ".\server.log"
Write-Host "Backend server started with PID: $($backendProcess.Id)" -ForegroundColor Green
Write-Host "Backend logs will be saved to BackEnd\server.log" -ForegroundColor Yellow

# Wait for server to initialize
Write-Host "Waiting for backend server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test if server is responding
$serverRunning = $false
$maxAttempts = 5
$currentAttempt = 0
$serverPort = 5004

while (-not $serverRunning -and $currentAttempt -lt $maxAttempts) {
    $currentAttempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$serverPort/api/health" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "Backend server is running on port $serverPort" -ForegroundColor Green
        }
    } catch {
        # Try next port
        $serverPort++
        Write-Host "Checking if server is running on port $serverPort..." -ForegroundColor Yellow
    }
    
    if (-not $serverRunning) {
        Start-Sleep -Seconds 2
    }
}

if (-not $serverRunning) {
    Write-Host "Backend server doesn't seem to be responding. Please check BackEnd\server.log" -ForegroundColor Red
    # Continue anyway, as the server might just be slow to start
}

# Step 3: Start frontend
Write-Host "`n[STEP 3] Starting frontend..." -ForegroundColor Magenta

# Navigate to frontend directory (use root directory with package.json)
Set-Location -Path "$PSScriptRoot"

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/c npm start" -NoNewWindow

# Done
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   APPLICATION STARTUP COMPLETE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "`nBackend API: http://localhost:$serverPort" -ForegroundColor Green
Write-Host "Frontend UI: http://localhost:3000" -ForegroundColor Green
Write-Host "`nNote: If the frontend doesn't open automatically, please visit http://localhost:3000 in your browser." -ForegroundColor Yellow
Write-Host "Backend logs are saved to BackEnd\server.log" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in the command window to stop all servers when done." -ForegroundColor Red

# Return to the root directory
Set-Location -Path $PSScriptRoot 