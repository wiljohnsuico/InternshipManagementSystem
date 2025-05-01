# PowerShell script to start the application
Write-Host "Starting Internship Management System..." -ForegroundColor Cyan

# Check if backend server is already running
Write-Host "Checking if backend server is already running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5004/api/status" -Method GET -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend server is already running." -ForegroundColor Green
    }
} catch {
    Write-Host "Backend server is not running. Starting it now..." -ForegroundColor Yellow
    
    # Change to the BackEnd directory
    $currentDirectory = Get-Location
    Set-Location -Path "$currentDirectory\BackEnd"
    
    # Start the server in a separate window
    Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow
    
    # Return to the original directory
    Set-Location -Path $currentDirectory
    
    # Wait for the server to start
    Write-Host "Waiting for server to initialize (5 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Check if server started successfully
Write-Host "Checking if server started successfully..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5004/api/status" -Method GET -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend server is running successfully!" -ForegroundColor Green
        
        # Open the application in browser
        Write-Host "Opening application in browser..." -ForegroundColor Cyan
        Start-Process -FilePath "student/application-tracking.html"
    } else {
        Write-Host "Backend server responded with status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to connect to backend server. The application may not work correctly." -ForegroundColor Red
    
    $openAnyway = Read-Host "Do you want to open the application anyway? (y/n)"
    if ($openAnyway -eq "y" -or $openAnyway -eq "Y") {
        Start-Process -FilePath "student/application-tracking.html"
    }
}

Write-Host "`nIf the application doesn't load correctly, please refresh the page after a few seconds." -ForegroundColor Yellow
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 