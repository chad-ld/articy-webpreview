@echo off
echo ========================================
echo SFTP Setup with External Password
echo ========================================
echo.
echo This will create SFTP config using password from external file
echo.

REM Check if password file exists
if not exist "E:\docs\text documents\batch\dh\dreamhost-password.txt" (
    echo ❌ Password file not found: E:\docs\text documents\batch\dh\dreamhost-password.txt
    echo.
    echo Please create the password file first:
    echo 1. Navigate to: E:\docs\text documents\batch\dh\
    echo 2. Edit file: dreamhost-password.txt
    echo 3. Add your DreamHost password to it
    echo.
    pause
    exit /b 1
)

echo ✅ Password file found
echo Running PowerShell setup script...
echo.

powershell -ExecutionPolicy Bypass -File "setup-sftp-external.ps1"

echo.
echo Setup completed!
pause
