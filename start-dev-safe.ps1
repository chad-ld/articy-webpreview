# Safe Development Startup Script
# Includes file integrity checking and automatic restoration

Write-Host "Starting Articy Web Viewer with file integrity protection..." -ForegroundColor Cyan
Write-Host ""

# Step 0: Kill any existing servers
Write-Host "Step 0: Cleaning up existing servers..." -ForegroundColor Yellow

try {
    Write-Host "Stopping any running PHP processes..." -ForegroundColor Gray
    $phpProcesses = Get-Process -Name "php" -ErrorAction SilentlyContinue
    if ($phpProcesses) {
        $phpProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped $($phpProcesses.Count) PHP process(es)" -ForegroundColor Gray
    }

    Write-Host "Stopping any running Node.js processes..." -ForegroundColor Gray
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    }

    # Wait a moment for processes to fully terminate
    Start-Sleep -Seconds 2
    Write-Host "SUCCESS: Server cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Error during cleanup: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Gray
}
Write-Host ""

# Step 1: Check file integrity
Write-Host "Step 1: Checking file integrity..." -ForegroundColor Yellow
try {
    & .\check-file-integrity.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: File integrity check returned non-zero exit code" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Error during file integrity check: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Gray
}

Write-Host ""

# Step 2: Start development servers
Write-Host "Step 2: Starting development servers..." -ForegroundColor Yellow

# Check if PHP is available
try {
    $phpVersion = php --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: PHP is available" -ForegroundColor Green
        Write-Host $phpVersion.Split("`n")[0] -ForegroundColor Gray

        # Start PHP server in background
        Write-Host ""
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
    } else {
        throw "PHP not found"
    }
} catch {
    Write-Host "ERROR: PHP is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Starting Vite dev server only..." -ForegroundColor Cyan
    npm run dev
}
