Write-Host "Testing API server connectivity..." -ForegroundColor Yellow

# Function to test an endpoint
function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing $Method $Url" -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 3
        Write-Host " - SUCCESS [Status: $($response.StatusCode)]" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " - FAILED [Error: $($_.Exception.Message)]" -ForegroundColor Red
        return $false
    }
}

# Test status endpoint
$statusWorking = Test-Endpoint -Url "http://localhost:5004/api/status"

if (-not $statusWorking) {
    Write-Host "`nAPI server is not running or not accessible." -ForegroundColor Red
    $startServer = Read-Host "Do you want to start the server? (y/n)"
    
    if ($startServer -eq "y" -or $startServer -eq "Y") {
        Write-Host "Starting server..." -ForegroundColor Yellow
        $currentDir = Get-Location
        
        # Change to BackEnd directory
        Set-Location -Path ".\BackEnd"
        
        # Start the server in a new window
        Start-Process -FilePath "node" -ArgumentList "run.js" -NoNewWindow
        
        # Return to original directory
        Set-Location -Path $currentDir
        
        # Wait for server to start
        Write-Host "Waiting for server to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Test again
        $statusWorking = Test-Endpoint -Url "http://localhost:5004/api/status"
    }
}

if ($statusWorking) {
    # Test applications endpoint
    $applicationsWorking = Test-Endpoint -Url "http://localhost:5004/api/applications"
    
    if (-not $applicationsWorking) {
        Write-Host "`nThe status endpoint is working, but applications endpoint is not responding." -ForegroundColor Yellow
        Write-Host "This might indicate an authentication issue or server configuration problem." -ForegroundColor Yellow
    } else {
        Write-Host "`nAll endpoints are working correctly!" -ForegroundColor Green
    }
    
    # Open the application
    $openApp = Read-Host "Do you want to open the application? (y/n)"
    if ($openApp -eq "y" -or $openApp -eq "Y") {
        Start-Process -FilePath "student/application-tracking.html"
    }
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 