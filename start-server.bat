@echo off
echo.
echo ========================================
echo   Articy Web Viewer - Local Server
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then try running this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo 🚀 Starting Articy Web Viewer server...
echo.

REM Start the server
node local-server.cjs

pause
