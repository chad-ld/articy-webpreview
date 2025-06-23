# Add PHP to Windows PATH
# Run this script as Administrator

Write-Host "🔧 Adding PHP to Windows PATH..." -ForegroundColor Cyan

# Check if PHP directory exists
$phpPath = "C:\php"
if (-not (Test-Path $phpPath)) {
    Write-Host "❌ PHP directory not found at $phpPath" -ForegroundColor Red
    Write-Host "Please extract PHP to C:\php first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if php.exe exists
$phpExe = "$phpPath\php.exe"
if (-not (Test-Path $phpExe)) {
    Write-Host "❌ php.exe not found at $phpExe" -ForegroundColor Red
    Write-Host "Please make sure PHP is extracted correctly to C:\php" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found PHP at $phpExe" -ForegroundColor Green

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")

# Check if PHP is already in PATH
if ($currentPath -like "*$phpPath*") {
    Write-Host "✅ PHP is already in PATH" -ForegroundColor Green
} else {
    try {
        # Add PHP to PATH
        $newPath = $currentPath + ";" + $phpPath
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
        Write-Host "✅ Successfully added PHP to PATH" -ForegroundColor Green
        Write-Host "⚠️ You may need to restart your terminal/IDE for changes to take effect" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to add PHP to PATH: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Test PHP
Write-Host ""
Write-Host "🧪 Testing PHP installation..." -ForegroundColor Cyan
try {
    $phpVersion = & "$phpExe" --version
    Write-Host "✅ PHP is working!" -ForegroundColor Green
    Write-Host $phpVersion.Split("`n")[0] -ForegroundColor Gray
} catch {
    Write-Host "❌ PHP test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 PHP installation complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your terminal/IDE" -ForegroundColor Yellow
Write-Host "2. Test with: php --version" -ForegroundColor Yellow
Write-Host "3. Run: .\start-dev-with-php.ps1" -ForegroundColor Yellow

Read-Host "Press Enter to exit"
