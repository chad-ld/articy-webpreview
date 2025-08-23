# File Integrity Checker for Dual Deployment
# Checks if critical files have been reverted and restores them if needed

Write-Host "Checking file integrity for dual deployment..." -ForegroundColor Cyan

$filesOk = $true

# Check HybridDatasetDetector for required method
$hybridFile = "src/utils/hybridDatasetDetector.js"
$hybridContent = Get-Content $hybridFile -Raw

if (-not $hybridContent.Contains("getLastSuccessfulMethod")) {
    Write-Host "ERROR: Missing getLastSuccessfulMethod in $hybridFile" -ForegroundColor Red
    Write-Host "Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "src/utils/hybridDatasetDetector.backup.js" $hybridFile -Force
    $filesOk = $false
}

if (-not $hybridContent.Contains("this.lastSuccessfulMethod = null")) {
    Write-Host "ERROR: Missing lastSuccessfulMethod property in $hybridFile" -ForegroundColor Red
    Write-Host "Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "src/utils/hybridDatasetDetector.backup.js" $hybridFile -Force
    $filesOk = $false
}

# Check Vite config for cache disabling
$viteFile = "vite.config.ts"
$viteContent = Get-Content $viteFile -Raw

if (-not $viteContent.Contains("cacheDir: false")) {
    Write-Host "ERROR: Missing cache disabling in $viteFile" -ForegroundColor Red
    Write-Host "Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "vite.config.backup.ts" $viteFile -Force
    $filesOk = $false
}

if (-not $viteContent.Contains("/datasets.php")) {
    Write-Host "ERROR: Missing PHP proxy configuration in $viteFile" -ForegroundColor Red
    Write-Host "Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "vite.config.backup.ts" $viteFile -Force
    $filesOk = $false
}

if ($filesOk) {
    Write-Host "SUCCESS: All files are intact - dual deployment configuration is correct" -ForegroundColor Green
} else {
    Write-Host "WARNING: Files were restored from backup - please restart your development server" -ForegroundColor Yellow
    Write-Host "TIP: Run this script before starting development to ensure file integrity" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "File Status Summary:" -ForegroundColor White

# Check hybrid detector status
if ($hybridContent.Contains('getLastSuccessfulMethod')) {
    Write-Host "- HybridDatasetDetector: OK" -ForegroundColor Green
} else {
    Write-Host "- HybridDatasetDetector: FIXED" -ForegroundColor Yellow
}

# Check vite config status
if ($viteContent.Contains('cacheDir: false')) {
    Write-Host "- Vite Configuration: OK" -ForegroundColor Green
} else {
    Write-Host "- Vite Configuration: FIXED" -ForegroundColor Yellow
}
