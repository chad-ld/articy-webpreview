# File Integrity Checker for Dual Deployment
# Checks if critical files have been reverted and restores them if needed

Write-Host "🔍 Checking file integrity for dual deployment..." -ForegroundColor Cyan

$filesOk = $true

# Check HybridDatasetDetector for required method
$hybridFile = "src/utils/hybridDatasetDetector.js"
$hybridContent = Get-Content $hybridFile -Raw

if (-not $hybridContent.Contains("getLastSuccessfulMethod()")) {
    Write-Host "❌ Missing getLastSuccessfulMethod() in $hybridFile" -ForegroundColor Red
    Write-Host "🔧 Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "src/utils/hybridDatasetDetector.backup.js" $hybridFile -Force
    $filesOk = $false
}

if (-not $hybridContent.Contains("this.lastSuccessfulMethod = null")) {
    Write-Host "❌ Missing lastSuccessfulMethod property in $hybridFile" -ForegroundColor Red
    Write-Host "🔧 Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "src/utils/hybridDatasetDetector.backup.js" $hybridFile -Force
    $filesOk = $false
}

# Check Vite config for cache disabling
$viteFile = "vite.config.ts"
$viteContent = Get-Content $viteFile -Raw

if (-not $viteContent.Contains("cacheDir: false")) {
    Write-Host "❌ Missing cache disabling in $viteFile" -ForegroundColor Red
    Write-Host "🔧 Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "vite.config.backup.ts" $viteFile -Force
    $filesOk = $false
}

if (-not $viteContent.Contains("/datasets.php")) {
    Write-Host "❌ Missing PHP proxy configuration in $viteFile" -ForegroundColor Red
    Write-Host "🔧 Restoring from backup..." -ForegroundColor Yellow
    Copy-Item "vite.config.backup.ts" $viteFile -Force
    $filesOk = $false
}

if ($filesOk) {
    Write-Host "✅ All files are intact - dual deployment configuration is correct" -ForegroundColor Green
} else {
    Write-Host "⚠️ Files were restored from backup - please restart your development server" -ForegroundColor Yellow
    Write-Host "💡 Run this script before starting development to ensure file integrity" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 File Status Summary:" -ForegroundColor White
Write-Host "- HybridDatasetDetector: $(if ($hybridContent.Contains('getLastSuccessfulMethod()')) { '✅ OK' } else { '❌ FIXED' })" -ForegroundColor $(if ($hybridContent.Contains('getLastSuccessfulMethod()')) { 'Green' } else { 'Yellow' })
Write-Host "- Vite Configuration: $(if ($viteContent.Contains('cacheDir: false')) { '✅ OK' } else { '❌ FIXED' })" -ForegroundColor $(if ($viteContent.Contains('cacheDir: false')) { 'Green' } else { 'Yellow' })
