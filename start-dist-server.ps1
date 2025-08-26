# Articy Web Viewer - Dist Folder Testing Server
# Serves the built dist folder using portable PHP for testing production builds locally

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

# Start PHP server
Write-Host "Starting PHP server on port $Port..." -ForegroundColor Green
Write-Host "Serving from: $DistDir" -ForegroundColor Gray

$ServerUrl = "http://localhost:$Port"

# Start PHP server
Write-Host "Starting PHP server..." -ForegroundColor Green
Write-Host "Command: php.exe -S localhost:$Port -t dist" -ForegroundColor Gray
Write-Host ""

# Change to dist directory and start PHP server
Set-Location $DistDir
& $PhpExe -S "localhost:$Port"

# The server will run in the foreground
# Open browser unless -NoBrowser is specified
if (!$NoBrowser) {
    Write-Host ""
    Write-Host "Opening browser in 3 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    Start-Process $ServerUrl
}
