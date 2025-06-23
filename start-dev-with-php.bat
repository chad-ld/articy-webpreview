@echo off
echo Starting Articy Web Viewer with PHP support...
echo.

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PHP is not installed or not in PATH
    echo.
    echo Please install PHP and add it to your PATH, or use one of these alternatives:
    echo 1. Install XAMPP: https://www.apachefriends.org/
    echo 2. Install PHP directly: https://windows.php.net/download/
    echo 3. Use the built-in server after building: npm run build ^&^& cd dist ^&^& php -S localhost:8080
    echo.
    pause
    exit /b 1
)

echo ✅ PHP is available
php --version
echo.

REM Start PHP server in background
echo 🚀 Starting PHP server on localhost:8080...
start /B php -S localhost:8080 -t public
timeout /t 2 /nobreak >nul

REM Start Vite dev server
echo 🚀 Starting Vite dev server on localhost:3000...
echo.
echo 📡 PHP requests will be proxied from Vite to PHP server
echo 🌐 Open: http://localhost:3000/
echo 🔧 PHP API: http://localhost:3000/datasets.php (proxied to localhost:8080)
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev

REM Cleanup: Kill PHP server when Vite stops
echo.
echo 🛑 Stopping PHP server...
taskkill /F /IM php.exe >nul 2>&1
echo ✅ Cleanup complete
