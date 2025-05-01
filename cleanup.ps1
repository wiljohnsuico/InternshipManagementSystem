# PowerShell script to kill all Node.js processes
Write-Host "`nStopping all Node.js processes..." -ForegroundColor Red

# Try to kill all node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, Path, StartTime -AutoSize
    
    $confirm = Read-Host "Do you want to kill all these Node.js processes? (y/n)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
        $nodeProcesses | ForEach-Object { 
            Stop-Process -Id $_.Id -Force
            Write-Host "Killed process ID: $($_.Id)" -ForegroundColor Green
        }
        Write-Host "All Node.js processes have been terminated." -ForegroundColor Green
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "No Node.js processes found running." -ForegroundColor Green
}

# Also check for processes on port 5004
Write-Host "`nChecking for processes using port 5004..." -ForegroundColor Yellow
$portProcesses = netstat -ano | Select-String ":5004"

if ($portProcesses) {
    Write-Host "Found processes using port 5004:" -ForegroundColor Yellow
    $portProcesses
    
    $confirm = Read-Host "Do you want to kill all processes using port 5004? (y/n)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        # Extract PIDs
        $pids = $portProcesses | ForEach-Object {
            $line = $_ -replace '\s+', ' '
            $parts = $line.Trim().Split(' ')
            $parts[-1]
        } | Sort-Object -Unique
        
        # Kill each PID
        foreach ($pid in $pids) {
            Write-Host "Killing process with PID $pid" -ForegroundColor Yellow
            taskkill /F /PID $pid
        }
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "No processes found using port 5004." -ForegroundColor Green
}

Write-Host "`nCleanup completed!" -ForegroundColor Green
Read-Host -Prompt "Press Enter to exit" 