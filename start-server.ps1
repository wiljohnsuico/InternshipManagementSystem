# PowerShell script to start the backend server
Write-Host "Starting Internship Management System Backend Server..." -ForegroundColor Green

# Change to the BackEnd directory
Set-Location -Path ".\BackEnd"
Write-Host "Current directory: $((Get-Location).Path)"

# Check if the server is already running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5004/api/status" -Method GET -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend server is already running." -ForegroundColor Green
    }
} catch {
    Write-Host "Backend server is not running. Starting it now..." -ForegroundColor Yellow
    
    # Start the server
    try {
        # Use Start-Process to start the server in a new window
        Start-Process -FilePath "node" -ArgumentList "start-server.js" -NoNewWindow
        
        # Wait for the server to start
        Write-Host "Waiting for server to initialize (5 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Check if the server started successfully
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5004/api/status" -Method GET -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Host "Backend server started successfully!" -ForegroundColor Green
            } else {
                Write-Host "Backend server responded with status code: $($response.StatusCode)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Failed to connect to backend server after startup. Please check for errors." -ForegroundColor Red
        }
    } catch {
        Write-Host "Error starting backend server: $_" -ForegroundColor Red
    }
}

# Return to the original directory
Set-Location -Path ".."

Write-Host "`nServer should be running at http://localhost:5004" -ForegroundColor Green
Write-Host "You can now open the application in your browser." -ForegroundColor Green
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 