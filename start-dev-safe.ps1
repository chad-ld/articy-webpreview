# Safe Development Startup Script
# Includes file integrity checking and automatic restoration

Write-Host "🚀 Starting Articy Web Viewer with file integrity protection..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check file integrity
Write-Host "🔍 Step 1: Checking file integrity..." -ForegroundColor Yellow
& .\check-file-integrity.ps1

Write-Host ""

# Step 2: Check git status
Write-Host "🔍 Step 2: Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️ Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Startup cancelled" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Git working tree is clean" -ForegroundColor Green
}

Write-Host ""

# Step 3: Start development servers
Write-Host "🔍 Step 3: Starting development servers..." -ForegroundColor Yellow

# Check if PHP is available
try {
    $phpVersion = php --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PHP is available" -ForegroundColor Green
        Write-Host $phpVersion.Split("`n")[0] -ForegroundColor Gray
        
        # Start with PHP support
        Write-Host ""
        Write-Host "🚀 Starting with PHP support..." -ForegroundColor Cyan
        & .\start-dev-with-php.ps1
    } else {
        throw "PHP not found"
    }
} catch {
    Write-Host "⚠️ PHP not available - starting in fallback mode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🚀 Starting Vite dev server only..." -ForegroundColor Cyan
    npm run dev
}
