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

        # Start with PHP support
        Write-Host ""
        Write-Host "Starting with PHP support..." -ForegroundColor Cyan
        & .\start-dev-with-php.ps1
    } else {
        throw "PHP not found"
    }
} catch {
    Write-Host "PHP not available - starting in fallback mode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting Vite dev server only..." -ForegroundColor Cyan
    npm run dev
}
