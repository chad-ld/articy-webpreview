# Articy Web Viewer - Dist Folder Testing Server
# Serves the built dist folder using portable PHP for testing production builds locally
# Includes cache busting features for reliable testing

param(
    [int]$Port = 8082,
    [switch]$NoBrowser
)

# Clear screen and show header
Clear-Host
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Articy Web Viewer - Dist Testing Server" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $ScriptDir "dist"
$PhpDir = Join-Path $ScriptDir "php-portable"
$PhpExe = Join-Path $PhpDir "php.exe"
$LogsDir = Join-Path $ScriptDir "logs"

# Create logs directory if it doesn't exist
if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Check if dist folder exists
if (!(Test-Path $DistDir)) {
    Write-Host "ERROR: dist folder not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first to create the dist folder." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if datasets folder exists in dist
$DistDatasetsDir = Join-Path $DistDir "datasets"

if (!(Test-Path $DistDatasetsDir)) {
    Write-Host "WARNING: No datasets folder found in dist/" -ForegroundColor Yellow
    Write-Host "Please manually copy your datasets to dist/datasets/ for testing." -ForegroundColor Yellow
    Write-Host ""
}

# Check if PHP is available
if (!(Test-Path $PhpExe)) {
    Write-Host "ERROR: PHP not found at $PhpExe" -ForegroundColor Red
    Write-Host "Please ensure php-portable folder is set up correctly." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if port is available
$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
    Write-Host "Port $Port is busy, trying alternative ports..." -ForegroundColor Yellow
    
    # Try alternative ports
    $AlternatePorts = @(8083, 8084, 8085, 8086)
    $PortFound = $false
    
    foreach ($AltPort in $AlternatePorts) {
        $AltPortInUse = Get-NetTCPConnection -LocalPort $AltPort -ErrorAction SilentlyContinue
        if (!$AltPortInUse) {
            $Port = $AltPort
            $PortFound = $true
            Write-Host "Using port $Port instead." -ForegroundColor Green
            break
        }
    }
    
    if (!$PortFound) {
        Write-Host "ERROR: No available ports found. Please stop other servers and try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Cache Busting Setup
Write-Host "Setting up cache busting features..." -ForegroundColor Yellow

# Create cache-busting PHP header file
$CacheBustingHeaders = @"
<?php
// Cache Busting Headers for Testing
// Prevents browser caching during development testing

// Only apply to PHP files, not static assets
if (strpos(`$_SERVER['REQUEST_URI'], '.php') !== false) {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('ETag: "' . uniqid() . '"');
}
?>
"@

$CacheBustingHeadersPath = Join-Path $DistDir "cache-bust-headers.php"
$CacheBustingHeaders | Out-File -FilePath $CacheBustingHeadersPath -Encoding UTF8

# Create cache-busting PHP configuration
$CacheBustingConfig = @"
; Cache Busting Configuration for Testing
; Prevents browser caching during development testing

; Disable output buffering for immediate responses
output_buffering = Off

; Disable opcache for testing (ensures fresh PHP execution)
opcache.enable = 0
opcache.enable_cli = 0

; Auto-prepend cache busting headers to all PHP requests
auto_prepend_file = "cache-bust-headers.php"
"@

$PhpIniPath = Join-Path $DistDir "php-cache-bust.ini"
$CacheBustingConfig | Out-File -FilePath $PhpIniPath -Encoding UTF8

Write-Host "✅ Cache busting configuration created" -ForegroundColor Green

# Start PHP server
Write-Host "Starting PHP server on port $Port with cache busting..." -ForegroundColor Green
Write-Host "Serving from: $DistDir" -ForegroundColor Gray

$ServerUrl = "http://localhost:$Port"

# Start PHP server
Write-Host "Starting PHP server..." -ForegroundColor Green
Write-Host "Command: php.exe -S localhost:$Port -t dist -c php-cache-bust.ini" -ForegroundColor Gray
Write-Host ""

# Change to dist directory and start PHP server with cache busting config
Set-Location $DistDir
& $PhpExe -S "localhost:$Port" -c "php-cache-bust.ini"

# The server will run in the foreground
# Open browser unless -NoBrowser is specified
if (!$NoBrowser) {
    Write-Host ""
    Write-Host "Opening browser in 3 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Start-Process $ServerUrl
}

Write-Host ""
Write-Host "🌐 Server running at: $ServerUrl" -ForegroundColor Green
Write-Host "📁 Serving from: $DistDir" -ForegroundColor Gray
Write-Host "🛡️ Cache busting: ENABLED" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Cleanup function for when server stops
function Cleanup {
    Write-Host ""
    Write-Host "Cleaning up cache busting files..." -ForegroundColor Yellow

    $CacheBustingHeadersPath = Join-Path $DistDir "cache-bust-headers.php"
    $PhpIniPath = Join-Path $DistDir "php-cache-bust.ini"

    if (Test-Path $CacheBustingHeadersPath) {
        Remove-Item $CacheBustingHeadersPath -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $PhpIniPath) {
        Remove-Item $PhpIniPath -Force -ErrorAction SilentlyContinue
    }

    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# Register cleanup for Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }
