# Server Cleanup Script
# Kills any running PHP or Node.js processes

Write-Host "Cleaning up development servers..." -ForegroundColor Cyan
Write-Host ""

# Kill PHP processes
Write-Host "Stopping PHP processes..." -ForegroundColor Yellow
$phpProcesses = Get-Process -Name "php" -ErrorAction SilentlyContinue
if ($phpProcesses) {
    $phpProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Stopped $($phpProcesses.Count) PHP process(es)" -ForegroundColor Green
} else {
    Write-Host "No PHP processes found" -ForegroundColor Gray
}

# Kill Node.js processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Gray
}

# Wait for processes to fully terminate
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "SUCCESS: Server cleanup complete" -ForegroundColor Green
Write-Host "All development servers have been stopped." -ForegroundColor Gray
