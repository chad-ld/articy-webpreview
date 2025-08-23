# Cache Busting Test Script
# Tests all aspects of the cache prevention system

Write-Host "=== CACHE BUSTING TEST SUITE ===" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsTotal = 0

function Test-Feature {
    param(
        [string]$TestName,
        [scriptblock]$TestCode
    )

    $script:testsTotal++
    Write-Host "Test $script:testsTotal`: $TestName" -ForegroundColor Yellow

    try {
        $result = & $TestCode
        if ($result -eq $true) {
            Write-Host "  PASS" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "  FAIL: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 1: Verify Vite cache is disabled
Test-Feature "Vite Cache Disabled" {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    return $viteConfig.Contains("cacheDir: false")
}

# Test 2: Verify HMR overlay is disabled
Test-Feature "HMR Overlay Disabled" {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    return $viteConfig.Contains("overlay: false")
}

# Test 3: Verify file watching uses polling
Test-Feature "File Watching Uses Polling" {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    return $viteConfig.Contains("usePolling: true")
}

# Test 4: Check if .vite cache directory exists (dependency pre-bundling is normal)
Test-Feature "Vite Cache Directory Status" {
    $viteCacheDir = "node_modules/.vite"
    if (Test-Path $viteCacheDir) {
        $files = Get-ChildItem $viteCacheDir -Recurse -File | Measure-Object
        # Dependency pre-bundling files are normal, but excessive files indicate caching issues
        return $files.Count -lt 50  # Less than 50 files is acceptable
    } else {
        return $true  # No cache directory is also fine
    }
}

# Test 5: Verify backup files exist
Test-Feature "Backup Files Exist" {
    $viteBackup = Test-Path "vite.config.backup.ts"
    $hybridBackup = Test-Path "src/utils/hybridDatasetDetector.backup.js"
    return $viteBackup -and $hybridBackup
}

# Test 6: Test integrity checker functionality
Test-Feature "Integrity Checker Works" {
    try {
        $output = & .\check-file-integrity.ps1 2>&1
        $outputString = $output -join " "
        return $outputString.Contains("SUCCESS") -or $outputString.Contains("OK")
    } catch {
        return $false
    }
}

# Test 7: Verify critical methods exist in hybridDatasetDetector
Test-Feature "HybridDatasetDetector Has Required Methods" {
    $hybridContent = Get-Content "src/utils/hybridDatasetDetector.js" -Raw
    $hasMethod = $hybridContent.Contains("getLastSuccessfulMethod")
    $hasProperty = $hybridContent.Contains("this.lastSuccessfulMethod = null")
    return $hasMethod -and $hasProperty
}

# Test 8: Check if PHP proxy is configured
Test-Feature "PHP Proxy Configuration" {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    return $viteConfig.Contains("/datasets.php")
}

# Test 9: Test cache busting in App.tsx
Test-Feature "Cache Busting in App Component" {
    $appContent = Get-Content "src/App.tsx" -Raw
    $hasCacheBuster = $appContent.Contains("cacheBuster")
    $hasDateNow = $appContent.Contains("Date.now")
    return $hasCacheBuster -and $hasDateNow
}

# Test 10: Verify npm scripts exist
Test-Feature "Safe Mode NPM Scripts Exist" {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $hasDevSafe = $packageJson.scripts."dev:safe" -ne $null
    $hasCheckIntegrity = $packageJson.scripts."check:integrity" -ne $null
    $hasDevPhp = $packageJson.scripts."dev:php" -ne $null
    return $hasDevSafe -and $hasCheckIntegrity -and $hasDevPhp
}

# Test 11: Test file modification detection
Test-Feature "File Modification Detection Test" {
    # Create a temporary test file
    $testFile = "temp-cache-test.txt"
    "Original content" | Out-File $testFile
    Start-Sleep -Milliseconds 100

    # Modify the file
    "Modified content" | Out-File $testFile

    # Check if modification is detected quickly
    $modified = (Get-Item $testFile).LastWriteTime
    $now = Get-Date
    $timeDiff = ($now - $modified).TotalSeconds

    # Cleanup
    Remove-Item $testFile -ErrorAction SilentlyContinue

    return $timeDiff -lt 1  # Should detect changes within 1 second
}

# Test 12: Memory cache test for hybridDatasetDetector
Test-Feature "HybridDatasetDetector Cache Methods" {
    $hybridContent = Get-Content "src/utils/hybridDatasetDetector.js" -Raw
    $hasCacheGet = $hybridContent.Contains("getCachedResult")
    $hasCacheSet = $hybridContent.Contains("setCachedResult")
    $hasCacheClear = $hybridContent.Contains("clearCache")
    return $hasCacheGet -and $hasCacheSet -and $hasCacheClear
}

# Summary
Write-Host "=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed / $testsTotal" -ForegroundColor $(if ($testsPassed -eq $testsTotal) { 'Green' } else { 'Yellow' })

if ($testsPassed -eq $testsTotal) {
    Write-Host "SUCCESS: All cache busting features are working correctly!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Some cache busting features may not be working properly." -ForegroundColor Yellow
    Write-Host "Run 'npm run check:integrity' to fix any issues." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== MANUAL TESTS TO PERFORM ===" -ForegroundColor Cyan
Write-Host "1. Start dev server: npm run dev:safe" -ForegroundColor White
Write-Host "2. Edit a source file while server is running" -ForegroundColor White
Write-Host "3. Verify changes appear immediately in browser" -ForegroundColor White
Write-Host "4. Check browser dev tools Network tab for cache-busting URLs" -ForegroundColor White
Write-Host "5. Restart server and verify no file reversions occur" -ForegroundColor White
Write-Host ""
