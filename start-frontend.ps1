# PowerShell script to start the frontend server
Write-Host "`nStarting the Frontend Server..." -ForegroundColor Yellow

# Navigate to the root directory with package.json
Set-Location -Path "$PSScriptRoot"

# Set environment variable for port
$env:PORT = 3000

# Start the frontend server
npm start

# In case of error, wait for user input before closing
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFrontend server failed to start. Check the error messages above." -ForegroundColor Red
    Read-Host -Prompt "Press Enter to exit"
} 