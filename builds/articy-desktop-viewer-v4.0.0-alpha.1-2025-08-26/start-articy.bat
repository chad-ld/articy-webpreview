@echo off
title Articy Web Viewer - Desktop Edition
cls
echo ================================================
echo    Articy Web Viewer - Desktop Edition
echo ================================================
echo.

REM Get current directory
set APP_DIR=%~dp0

REM Create logs directory if it doesn't exist
if not exist "%APP_DIR%logs" mkdir "%APP_DIR%logs"

REM Check if PHP is available
if not exist "%APP_DIR%php\php.exe" (
    echo ERROR: PHP not found in php\php.exe
    echo Please follow the PHP setup instructions in php\README-PHP-SETUP.txt
    echo.
    pause
    exit /b 1
)

REM Clean up any existing servers first
echo Cleaning up any existing servers...
taskkill /F /IM php.exe 2>nul
taskkill /F /IM node.exe 2>nul
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)
echo Server cleanup complete.
echo.

REM Check if port 8080 is available
netstat -an | find "8080" >nul
if %errorlevel%==0 (
    echo Port 8080 is busy, trying 8081...
    set PORT=8081
) else (
    set PORT=8080
)

REM Start PHP server
echo Starting server on port %PORT%...
start /B "" "%APP_DIR%php\php.exe" -S localhost:%PORT% -t "%APP_DIR%app" -c "%APP_DIR%php\php.ini"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open in browser
echo Opening Articy Web Viewer...
start http://localhost:%PORT%

echo.
echo SUCCESS: Articy Web Viewer is running!
echo URL: http://localhost:%PORT%
echo App folder: %APP_DIR%app
echo Logs folder: %APP_DIR%logs
echo.
echo To add datasets:
echo    - Copy your Articy JSON dataset folders to the 'app' folder
echo    - Example: Copy 'myproject.json' folder to 'app\myproject.json'
echo    - OR drag and drop files directly into the web interface
echo.
echo IMPORTANT: Keep this window open while using the app
echo To stop: Close this window or run stop-articy.bat
echo.
echo Monitoring server... (Press Ctrl+C to stop manually)

REM Monitor the PHP process and exit when it's killed
:monitor_loop
timeout /t 2 /nobreak >nul
tasklist /FI "IMAGENAME eq php.exe" 2>nul | find /i "php.exe" >nul
if errorlevel 1 (
    echo.
    echo Server stopped. Closing window...
    timeout /t 2 /nobreak >nul
    exit
)
goto monitor_loop