@echo off
echo Stopping Internship Management System...
powershell -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"
pause 