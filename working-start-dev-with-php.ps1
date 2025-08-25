# Articy Web Viewer - Development Server with PHP Support
Write-Host "Starting Articy Web Viewer with PHP support..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing servers first
Write-Host "Cleaning up existing servers..." -ForegroundColor Yellow
Write-Host "Stopping any running PHP processes..." -ForegroundColor Gray
Get-Process -Name "php" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Stopping any running Node.js processes..." -ForegroundColor Gray
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2
Write-Host "SUCCESS: Server cleanup complete" -ForegroundColor Green
Write-Host ""

# Check if PHP is available
try {
    $phpVersion = php --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: PHP is available" -ForegroundColor Green
        Write-Host $phpVersion.Split("`n")[0] -ForegroundColor Gray
        Write-Host ""
    } else {
        throw "PHP not found"
    }
} catch {
    Write-Host "ERROR: PHP is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PHP and add it to your PATH, or use one of these alternatives:" -ForegroundColor Yellow
    Write-Host "1. Install XAMPP: https://www.apachefriends.org/" -ForegroundColor Yellow
    Write-Host "2. Install PHP directly: https://windows.php.net/download/" -ForegroundColor Yellow
    Write-Host "3. Use the built-in server after building: npm run build && cd dist && php -S localhost:8080" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
?7Art PHP server in background
Write-Host "Starting PHP server on localhost:8080..." -ForegroundColor Cyan
$phpProcess = Start-Process -FilePath "php" -ArgumentList "-S", "localhost:8080", "-t", "public" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

# Check if PHP server started successfully
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/datasets.php" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "SUCCESS: PHP server started successfully" -ForegroundColor Green
} catch {
    Write-Host "WARNING: PHP server may not have started properly" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting Vite dev server on localhost:3000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "PHP requests will be proxied from Vite to PHP server" -ForegroundColor Gray
Write-Host "Open: http://localhost:3000/" -ForegroundColor Green
Write-Host "PHP API: http://localhost:3000/datasets.php (proxied to localhost:8080)" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start Vite dev server
try {
    npm run dev
} finally {
    # Cleanup: Kill PHP server when Vite stops
    Write-Host ""
    Write-Host "Stopping PHP server..." -ForegroundColor Yellow
    if ($phpProcess -and !$phpProcess.HasExited) {
        Stop-Process -Id $phpProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Also kill any remaining PHP processes on port 8080
    Get-Process -Name "php" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "php" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Cleanup complete" -ForegroundColor Green
}

