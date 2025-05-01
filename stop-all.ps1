# Script to stop all running servers

Write-Host "`n========================================================" -ForegroundColor Red
Write-Host "               STOPPING ALL SERVERS               " -ForegroundColor Red
Write-Host "========================================================`n" -ForegroundColor Red

# Function to kill processes on a port
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
                taskkill /F /PID $pid
            }
        }
    } else {
        Write-Host "No processes found using port $Port" -ForegroundColor Green
    }
}

# Kill Node.js processes
$nodeProcesses = Get-Process -Name "node", "npm" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, Path -AutoSize
    
    Write-Host "Killing Node.js processes..." -ForegroundColor Red
    $nodeProcesses | ForEach-Object { 
        taskkill /F /PID $_.Id
    }
    
    # Wait for processes to stop
    Start-Sleep -Seconds 1
} else {
    Write-Host "No Node.js processes found running" -ForegroundColor Green
}

# Kill processes on specific ports
Kill-ProcessOnPort -Port 5004
Kill-ProcessOnPort -Port 5005
Kill-ProcessOnPort -Port 5006
Kill-ProcessOnPort -Port 5007
Kill-ProcessOnPort -Port 5008
Kill-ProcessOnPort -Port 3000

Write-Host "`nAll servers have been stopped." -ForegroundColor Green
Write-Host "You can now start the application again using start-all.ps1`n" -ForegroundColor Green 