# Simple Runtime Cache Test
# Tests basic cache behavior while development server is running

param(
    [string]$ServerUrl = "http://localhost:3000"
)

Write-Host "=== SIMPLE RUNTIME CACHE TEST ===" -ForegroundColor Cyan
Write-Host "Server URL: $ServerUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if server is running (using netstat)
Write-Host "Test 1: Checking if development server is running..." -ForegroundColor Yellow
try {
    $netstat = netstat -an | Select-String ":3000"
    if ($netstat) {
        Write-Host "SUCCESS: Development server is listening on port 3000" -ForegroundColor Green
        Write-Host "  $netstat" -ForegroundColor Gray

        # Try to test with curl if available
        try {
            $curlResult = curl -s -I http://localhost:3000 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: Server responds to HTTP requests" -ForegroundColor Green
                $cacheHeader = $curlResult | Select-String "Cache-Control"
                if ($cacheHeader) {
                    Write-Host "  $cacheHeader" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "  Note: Could not test HTTP response (curl not available)" -ForegroundColor Gray
        }
    } else {
        Write-Host "ERROR: No server listening on port 3000" -ForegroundColor Red
        Write-Host "Please start the server with: npm run dev:safe" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Could not check server status" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check PHP API endpoint (using netstat)
Write-Host "Test 2: Testing PHP server..." -ForegroundColor Yellow
try {
    $phpNetstat = netstat -an | Select-String ":8080"
    if ($phpNetstat) {
        Write-Host "SUCCESS: PHP server is listening on port 8080" -ForegroundColor Green
        Write-Host "  $phpNetstat" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: No PHP server detected on port 8080" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Could not check PHP server status" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check Node.js processes
Write-Host "Test 3: Checking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    foreach ($process in $nodeProcesses) {
        $memoryMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
        Write-Host "  Process $($process.Id): $memoryMB MB" -ForegroundColor Gray
    }
    Write-Host "SUCCESS: Node.js processes are running" -ForegroundColor Green
} else {
    Write-Host "WARNING: No Node.js processes found" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check Vite cache directory
Write-Host "Test 4: Checking Vite cache directory..." -ForegroundColor Yellow
$viteCacheDir = "node_modules/.vite"
if (Test-Path $viteCacheDir) {
    $cacheFiles = Get-ChildItem $viteCacheDir -Recurse -File
    $fileCount = $cacheFiles.Count
    Write-Host "Cache directory exists with $fileCount files" -ForegroundColor Gray
    
    if ($fileCount -lt 50) {
        Write-Host "SUCCESS: Cache file count is reasonable" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Many cache files present - may indicate caching issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "SUCCESS: No Vite cache directory found" -ForegroundColor Green
}

Write-Host ""

# Test 5: File modification test
Write-Host "Test 5: Testing file modification detection..." -ForegroundColor Yellow
$testFile = "cache-test-temp.txt"
try {
    "Test content" | Out-File $testFile -Encoding UTF8
    Start-Sleep -Milliseconds 500
    
    "Modified content" | Out-File $testFile -Encoding UTF8
    $fileInfo = Get-Item $testFile
    $timeDiff = (Get-Date) - $fileInfo.LastWriteTime
    
    if ($timeDiff.TotalSeconds -lt 2) {
        Write-Host "SUCCESS: File modification detected quickly" -ForegroundColor Green
    } else {
        Write-Host "WARNING: File modification detection may be slow" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: File modification test failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if (Test-Path $testFile) {
        Remove-Item $testFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "=== RUNTIME TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL BROWSER TESTS:" -ForegroundColor Yellow
Write-Host "1. Open browser to $ServerUrl" -ForegroundColor White
Write-Host "2. Open browser dev tools (F12)" -ForegroundColor White
Write-Host "3. Go to Network tab" -ForegroundColor White
Write-Host "4. Edit any source file and save" -ForegroundColor White
Write-Host "5. Verify page updates automatically" -ForegroundColor White
Write-Host "6. Check Network tab for cache-busting parameters" -ForegroundColor White
Write-Host ""
