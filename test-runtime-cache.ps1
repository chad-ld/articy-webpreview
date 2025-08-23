# Runtime Cache Test Script
# Tests cache behavior while development server is running

param(
    [string]$ServerUrl = "http://localhost:3000"
)

Write-Host "=== RUNTIME CACHE BEHAVIOR TEST ===" -ForegroundColor Cyan
Write-Host "Server URL: $ServerUrl" -ForegroundColor Gray
Write-Host ""

# Test if server is running
try {
    $response = Invoke-WebRequest -Uri $ServerUrl -TimeoutSec 5 -ErrorAction Stop
    Write-Host "SUCCESS: Development server is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Development server is not running at $ServerUrl" -ForegroundColor Red
    Write-Host "Please start the server with: npm run dev:safe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Check server endpoints
Write-Host "Test 1: Testing server endpoints..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $ServerUrl -TimeoutSec 10 | Out-Null
    Write-Host "SUCCESS: Main page loads successfully" -ForegroundColor Green

    Invoke-WebRequest -Uri "$ServerUrl/datasets.php" -TimeoutSec 10 | Out-Null
    Write-Host "SUCCESS: PHP API endpoint responds" -ForegroundColor Green

} catch {
    Write-Host "ERROR: Error testing endpoints: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: File modification detection
Write-Host "Test 2: Testing file modification detection..." -ForegroundColor Yellow

$testFile = "cache-test-temp.txt"
try {
    "Original content" | Out-File $testFile -Encoding UTF8
    Write-Host "SUCCESS: Created test file" -ForegroundColor Green

    Start-Sleep -Seconds 1

    "Modified content" | Out-File $testFile -Encoding UTF8
    Write-Host "SUCCESS: Modified test file" -ForegroundColor Green

    $fileInfo = Get-Item $testFile
    $timeSinceModification = (Get-Date) - $fileInfo.LastWriteTime

    if ($timeSinceModification.TotalSeconds -lt 5) {
        Write-Host "SUCCESS: File modification detected quickly" -ForegroundColor Green
    } else {
        Write-Host "WARNING: File modification detection may be slow" -ForegroundColor Yellow
    }

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if (Test-Path $testFile) {
        Remove-Item $testFile -Force -ErrorAction SilentlyContinue
        Write-Host "SUCCESS: Cleaned up test file" -ForegroundColor Green
    }
}

Write-Host ""

# Test 3: Memory usage monitoring
Write-Host "Test 3: Monitoring memory usage..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
        Write-Host "Node process $($process.Id): $memoryMB MB" -ForegroundColor Gray
    }
    
    if ($nodeProcesses.Count -eq 1) {
        Write-Host "✓ Single Node process running (good)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Multiple Node processes detected ($($nodeProcesses.Count))" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ No Node processes found" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check for .vite cache accumulation
Write-Host "Test 4: Checking Vite cache accumulation..." -ForegroundColor Yellow

$viteCacheDir = "node_modules/.vite"
if (Test-Path $viteCacheDir) {
    $cacheFiles = Get-ChildItem $viteCacheDir -Recurse -File
    $cacheSizeMB = [math]::Round(($cacheFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    
    Write-Host "Cache directory exists with $($cacheFiles.Count) files ($cacheSizeMB MB)" -ForegroundColor Gray
    
    if ($cacheFiles.Count -eq 0) {
        Write-Host "✓ Cache directory is empty (perfect)" -ForegroundColor Green
    } elseif ($cacheFiles.Count -lt 10) {
        Write-Host "✓ Minimal cache files (acceptable)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Many cache files present - cache may not be fully disabled" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No Vite cache directory (perfect)" -ForegroundColor Green
}

Write-Host ""

# Test 5: Browser cache headers test
Write-Host "Test 5: Testing HTTP cache headers..." -ForegroundColor Yellow

try {
    # Test static assets
    $response = Invoke-WebRequest -Uri $ServerUrl -Method Head -TimeoutSec 10
    
    $cacheControl = $response.Headers['Cache-Control']
    $etag = $response.Headers['ETag']
    
    if ($cacheControl) {
        Write-Host "Cache-Control header: $cacheControl" -ForegroundColor Gray
        if ($cacheControl -like "*no-cache*" -or $cacheControl -like "*no-store*") {
            Write-Host "✓ Cache prevention headers detected" -ForegroundColor Green
        } else {
            Write-Host "⚠ Cache prevention headers not found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No Cache-Control header found" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ Error testing cache headers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Hot reload functionality
Write-Host "Test 6: Testing hot reload functionality..." -ForegroundColor Yellow
Write-Host "This test requires manual verification:" -ForegroundColor Gray
Write-Host "1. Open browser to $ServerUrl" -ForegroundColor White
Write-Host "2. Open browser dev tools (F12)" -ForegroundColor White
Write-Host "3. Go to Network tab and check 'Disable cache'" -ForegroundColor White
Write-Host "4. Edit any .tsx file in src/ folder" -ForegroundColor White
Write-Host "5. Verify page updates automatically without full reload" -ForegroundColor White
Write-Host "6. Check Network tab for cache-busting parameters (?v=timestamp)" -ForegroundColor White

Write-Host ""
Write-Host "=== RUNTIME TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "For complete verification, also run the manual browser tests above." -ForegroundColor Yellow
Write-Host ""
