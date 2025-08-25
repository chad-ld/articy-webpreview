/**
 * Desktop Package Creator
 * Creates a portable desktop version of the Articy Web Viewer
 */

import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DesktopPackageCreator {
  constructor() {
    // Generate the package name using the same convention as ZIP files
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const version = packageJson.version;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const packageName = `articy-desktop-viewer-v${version}-${timestamp}`;

    this.packageDir = path.join('builds', packageName);
    this.appDir = path.join(this.packageDir, 'app');
    this.phpDir = path.join(this.packageDir, 'php');
    this.logsDir = path.join(this.packageDir, 'logs');
  }

  async createDesktopPackage() {
    console.log('🏗️ Creating desktop package...');
    
    try {
      // 1. Clean and create package directory
      console.log('📁 Setting up package directory...');
      await this.setupPackageDirectory();
      
      // 2. Copy built web application
      console.log('📁 Copying built application...');
      await this.copyBuiltApplication();
      
      // 3. Download portable PHP
      console.log('⬇️ Setting up portable PHP...');
      await this.setupPortablePHP();
      
      // 4. Create launcher scripts
      console.log('📝 Creating launcher scripts...');
      await this.createLauncherScripts();
      
      // 5. Create user documentation
      console.log('📚 Creating user documentation...');
      await this.createUserDocumentation();
      
      console.log('✅ Desktop package created successfully!');
      console.log(`📁 Package location: ${path.resolve(this.packageDir)}`);
      console.log('');
      console.log('📦 Package contents:');
      console.log('  - start-articy.bat (main launcher)');
      console.log('  - stop-articy.bat (cleanup script)');
      console.log('  - app/ (web application)');
      console.log('  - php/ (portable PHP server)');
      console.log('  - datasets/ (sample datasets)');
      console.log('  - README.txt (user instructions)');
      console.log('');
      console.log('🎯 Ready for testing or distribution!');
      console.log('💡 To create ZIP: Right-click folder → Send to → Compressed folder');
      
    } catch (error) {
      console.error('❌ Failed to create desktop package:', error.message);
      throw error;
    }
  }

  async setupPackageDirectory() {
    // Clean and create package directory
    await fs.remove(this.packageDir);
    await fs.ensureDir(this.appDir);
    await fs.ensureDir(this.phpDir);
    await fs.ensureDir(this.logsDir);
  }

  async copyBuiltApplication() {
    // Check if dist directory exists
    if (!await fs.pathExists('dist')) {
      throw new Error('Build directory (dist) not found. Run "npm run build" first.');
    }

    // Copy built web application
    await fs.copy('dist', this.appDir);

    // Remove unnecessary dataset files from app folder (desktop uses ../datasets/ instead)
    await this.removeUnnecessaryDatasets();

    // Ensure PHP files are copied and modify datasets.php for desktop
    const phpFiles = ['append-log.php', 'cleanup-sessions.php', 'save-log.php'];
    for (const phpFile of phpFiles) {
      const publicPath = path.join('public', phpFile);
      const appPath = path.join(this.appDir, phpFile);

      if (await fs.pathExists(publicPath)) {
        await fs.copy(publicPath, appPath);
      }
    }

    // Copy the original datasets.php without modification
    const originalDatasetsPath = path.join('public', 'datasets.php');
    if (await fs.pathExists(originalDatasetsPath)) {
      await fs.copy(originalDatasetsPath, path.join(this.appDir, 'datasets.php'));
    }
  }

  async setupPortablePHP() {
    console.log('📁 Setting up portable PHP from local files...');

    try {
      // Copy portable PHP from local folder
      await this.copyPortablePHP();

      // Create optimized php.ini
      await this.createPHPConfig();

      console.log('✅ Portable PHP setup complete');

    } catch (error) {
      console.warn('⚠️ Failed to copy PHP from local folder:', error.message);
      console.log('📝 Creating manual setup instructions...');

      // Fallback to manual setup instructions
      await this.createManualPHPSetup();
    }
  }

  async copyPortablePHP() {
    const phpSourceDir = path.join(__dirname, '..', 'php-portable');

    // Check if php-portable folder exists
    if (!await fs.pathExists(phpSourceDir)) {
      throw new Error(`PHP portable folder not found at: ${phpSourceDir}\nPlease extract PHP to this folder.`);
    }

    console.log(`📁 Copying PHP from: ${phpSourceDir}`);

    // Essential files to copy
    const essentialFiles = [
      'php.exe',
      'php8ts.dll',
      'libcrypto-3-x64.dll',
      'libssl-3-x64.dll',
      'ext/php_mbstring.dll',
      'ext/php_fileinfo.dll',
      'ext/php_openssl.dll'
    ];

    // Optional files (JSON is built into PHP 8.3+ core)
    const optionalFiles = [
      'ext/php_json.dll'  // Not needed in PHP 8.3+
    ];

    // Create ext directory
    await fs.ensureDir(path.join(this.phpDir, 'ext'));

    let copiedCount = 0;

    // Copy essential files
    for (const file of essentialFiles) {
      const sourcePath = path.join(phpSourceDir, file);
      const destPath = path.join(this.phpDir, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        console.log(`  ✓ Copied ${file}`);
        copiedCount++;
      } else {
        console.warn(`  ⚠️ Missing: ${file}`);
      }
    }

    // Copy optional files (don't warn if missing)
    for (const file of optionalFiles) {
      const sourcePath = path.join(phpSourceDir, file);
      const destPath = path.join(this.phpDir, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        console.log(`  ✓ Copied ${file} (optional)`);
        copiedCount++;
      }
    }

    if (copiedCount < 4) {
      throw new Error(`Only copied ${copiedCount} essential files, expected at least 4. Check if PHP was extracted correctly to php-portable/`);
    }

    // Verify php.exe works
    try {
      const phpExePath = path.join(this.phpDir, 'php.exe');
      if (await fs.pathExists(phpExePath)) {
        console.log(`✅ PHP copied successfully (${copiedCount} files)`);
        console.log(`  📍 PHP executable: ${phpExePath}`);
      } else {
        throw new Error('php.exe not found after copy');
      }
    } catch (error) {
      throw new Error(`PHP verification failed: ${error.message}`);
    }
  }



  async createPHPConfig() {
    const phpIni = `
; PHP Configuration for Articy Desktop Viewer
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 100M
post_max_size = 100M
extension_dir = "./ext"

; Enable required extensions
; extension=json  ; JSON support is built-in to PHP 8.x
extension=mbstring
extension=fileinfo
extension=openssl

; Disable unnecessary extensions for smaller footprint
; extension=curl
; extension=gd
; extension=mysqli
; extension=pdo_mysql

; Security settings
expose_php = Off
display_errors = Off
log_errors = On
error_log = "../logs/php_errors.log"

; Performance settings
opcache.enable = 0
realpath_cache_size = 4096K
realpath_cache_ttl = 600
`;

    await fs.writeFile(path.join(this.phpDir, 'php.ini'), phpIni.trim());
  }

  async createManualPHPSetup() {
    // Create PHP directory structure for manual setup
    await fs.ensureDir(path.join(this.phpDir, 'ext'));

    // Create basic php.ini
    await this.createPHPConfig();

    // Create manual setup instructions
    const phpReadme = `
PHP Setup Instructions - MANUAL INSTALLATION REQUIRED
====================================================

The PHP copy from php-portable/ folder failed. Please check:

TROUBLESHOOTING:
1. Ensure php-portable/ folder exists in project root
2. Extract PHP 8.3+ portable ZIP to php-portable/ folder
   - Download from: https://windows.php.net/download/
   - Choose "VS16 x64 Thread Safe" version
   - Extract the entire ZIP contents to php-portable/

3. Required files in php-portable/:
   Essential Files:
   - php.exe
   - php8ts.dll (or php8ts.dll)
   - libcrypto-3-x64.dll
   - libssl-3-x64.dll

   Extensions (in ext/ subfolder):
   - ext/php_json.dll
   - ext/php_mbstring.dll
   - ext/php_fileinfo.dll
   - ext/php_openssl.dll

4. Verify installation:
   - Open command prompt in php-portable/
   - Run: php.exe --version
   - Should show PHP 8.x information

5. Re-run: npm run build:desktop

The php.ini file is already configured for the desktop viewer.
`;

    await fs.writeFile(path.join(this.phpDir, 'README-PHP-SETUP.txt'), phpReadme.trim());
  }



  async createDesktopFileServer() {
    const fileServerContent = `<?php
/**
 * Desktop File Server for Dataset Files
 * Serves individual JSON files from dataset folders
 */

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request URI and parse it
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Remove leading slash and query parameters
$path = ltrim($path, '/');

// Check if this is a dataset file request (pattern: datasetName.json/filename.json)
if (preg_match('/^([^\/]+\\.json)\\/([^\/]+\\.json)$/', $path, $matches)) {
    $datasetFolder = $matches[1];
    $fileName = $matches[2];

    // Build the full path to the file
    $datasetsDir = dirname(__FILE__) . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "datasets";
    $filePath = $datasetsDir . DIRECTORY_SEPARATOR . $datasetFolder . DIRECTORY_SEPARATOR . $fileName;

    // Security check: ensure the file is within the datasets directory
    $realDatasetsDir = realpath($datasetsDir);
    $realFilePath = realpath($filePath);

    if ($realFilePath && strpos($realFilePath, $realDatasetsDir) === 0 && file_exists($filePath) && is_readable($filePath)) {
        // Determine content type
        $contentType = 'application/json';
        if (pathinfo($fileName, PATHINFO_EXTENSION) === 'json') {
            $contentType = 'application/json';
        }

        // Set appropriate headers
        header("Content-Type: $contentType");
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Serve the file
        readfile($filePath);
        exit();
    } else {
        // File not found or not accessible
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'File not found',
            'path' => $path,
            'dataset' => $datasetFolder,
            'file' => $fileName
        ]);
        exit();
    }
}

// If we get here, this is not a dataset file request
// Return 404 for unknown requests
http_response_code(404);
header('Content-Type: application/json');
echo json_encode([
    'error' => 'Not found',
    'path' => $path
]);
?>`;

    await fs.writeFile(path.join(this.appDir, 'file-server.php'), fileServerContent);
  }

  async removeUnnecessaryDatasets() {
    console.log('🗑️ Removing unnecessary dataset files from app folder...');

    // List of dataset files/folders to remove from app directory
    // These are copied from the web build but not needed for desktop
    const unnecessaryItems = [
      'demo.json',
      'demo3old.json',
      'demo4.json',
      'mpos.json',
      'mpos1.5.json',
      'mpos_nw.json',
      'adventure.json',
      'mystory.json',
      'config.json'  // Also not needed for desktop
    ];

    let removedCount = 0;
    let savedSpace = 0;

    for (const item of unnecessaryItems) {
      const itemPath = path.join(this.appDir, item);

      if (await fs.pathExists(itemPath)) {
        try {
          // Calculate size before removal
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            // For directories, calculate total size recursively
            const dirSize = await this.calculateDirectorySize(itemPath);
            savedSpace += dirSize;
          } else {
            savedSpace += stats.size;
          }

          // Remove the item
          await fs.remove(itemPath);
          console.log(`  ✓ Removed ${item}`);
          removedCount++;

        } catch (error) {
          console.warn(`  ⚠️ Failed to remove ${item}:`, error.message);
        }
      }
    }

    const savedSpaceMB = (savedSpace / (1024 * 1024)).toFixed(1);
    console.log(`✅ Cleaned up ${removedCount} unnecessary items, saved ${savedSpaceMB} MB`);
  }

  async calculateDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          totalSize += await this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }

    return totalSize;
  }

  async createLauncherScripts() {
    // Create start-articy.bat
    const startScript = `@echo off
title Articy Web Viewer - Desktop Edition
cls
echo ================================================
echo    Articy Web Viewer - Desktop Edition
echo ================================================
echo.

REM Get current directory
set APP_DIR=%~dp0

REM Create logs directory if it doesn't exist
if not exist "%APP_DIR%logs" mkdir "%APP_DIR%logs"

REM Check if PHP is available
if not exist "%APP_DIR%php\\php.exe" (
    echo ERROR: PHP not found in php\\php.exe
    echo Please follow the PHP setup instructions in php\\README-PHP-SETUP.txt
    echo.
    pause
    exit /b 1
)

REM Clean up any existing servers first
echo Cleaning up any existing servers...
taskkill /F /IM php.exe 2>nul
taskkill /F /IM node.exe 2>nul
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)
echo Server cleanup complete.
echo.

REM Check if port 8080 is available
netstat -an | find "8080" >nul
if %errorlevel%==0 (
    echo Port 8080 is busy, trying 8081...
    set PORT=8081
) else (
    set PORT=8080
)

REM Start PHP server
echo Starting server on port %PORT%...
start /B "" "%APP_DIR%php\\php.exe" -S localhost:%PORT% -t "%APP_DIR%app" -c "%APP_DIR%php\\php.ini"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open in browser
echo Opening Articy Web Viewer...
start http://localhost:%PORT%

echo.
echo SUCCESS: Articy Web Viewer is running!
echo URL: http://localhost:%PORT%
echo App folder: %APP_DIR%app
echo Logs folder: %APP_DIR%logs
echo.
echo To add datasets:
echo    - Copy your Articy JSON dataset folders to the 'app' folder
echo    - Example: Copy 'myproject.json' folder to 'app\\myproject.json'
echo    - OR drag and drop files directly into the web interface
echo.
echo IMPORTANT: Keep this window open while using the app
echo To stop: Close this window or run stop-articy.bat
echo.
echo Monitoring server... (Press Ctrl+C to stop manually)

REM Monitor the PHP process and exit when it's killed
:monitor_loop
timeout /t 2 /nobreak >nul
tasklist /FI "IMAGENAME eq php.exe" 2>nul | find /i "php.exe" >nul
if errorlevel 1 (
    echo.
    echo Server stopped. Closing window...
    timeout /t 2 /nobreak >nul
    exit
)
goto monitor_loop`;

    await fs.writeFile(path.join(this.packageDir, 'start-articy.bat'), startScript);

    // Create stop-articy.bat
    const stopScript = `@echo off
title Stopping Articy Web Viewer
echo Stopping Articy Web Viewer...
echo.

REM Kill PHP processes
echo Stopping PHP servers...
taskkill /F /IM php.exe 2>nul
if %errorlevel%==0 (
    echo   ✓ PHP processes stopped
) else (
    echo   ℹ No PHP processes found
)

REM Kill Node.js processes (in case any are running)
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo   ✓ Node.js processes stopped
) else (
    echo   ℹ No Node.js processes found
)

REM Kill processes using ports 8080-8085
echo Stopping processes on ports 8080-8085...
set KILLED_PROCESSES=0
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
        if !errorlevel!==0 set /A KILLED_PROCESSES+=1
    )
)
if %KILLED_PROCESSES% GTR 0 (
    echo   ✓ Stopped %KILLED_PROCESSES% port processes
) else (
    echo   ℹ No processes found on target ports
)

echo.
echo ✅ SUCCESS: All Articy Web Viewer processes stopped
echo ℹ  Startup windows will close automatically when servers stop
echo 📁 NOTE: Your datasets and logs are preserved in their folders
echo.
echo This window will close in 3 seconds...
timeout /t 3 /nobreak >nul
exit`;

    await fs.writeFile(path.join(this.packageDir, 'stop-articy.bat'), stopScript);
  }



  async createUserDocumentation() {
    const readme = `Articy Web Viewer - Desktop Edition
===================================

QUICK START:
1. Double-click "start-articy.bat"
2. Your browser will open automatically
3. Start exploring your interactive stories!

ADDING YOUR OWN DATASETS:
- Copy your Articy JSON dataset folders to the "app" folder
- Example: Copy "myproject.json" folder to "app/myproject.json"
- OR drag and drop files directly into the web interface

STOPPING THE APPLICATION:
- Close the command window, OR
- Double-click "stop-articy.bat"

TROUBLESHOOTING:
- If port 8080 is busy, the app will try 8081 automatically
- Check the command window for any error messages
- Your datasets and logs are preserved between sessions
- If PHP errors occur, check php/README-PHP-SETUP.txt

SYSTEM REQUIREMENTS:
- Windows 7 or later
- Any modern web browser
- ~50MB free disk space

INCLUDED COMPONENTS:
- Portable PHP 8.3 (no installation required)
- Complete web application
- Sample datasets for immediate use
- Automatic launcher scripts

For more help, visit: https://github.com/chad-ld/articy-webpreview

Version: 4.x Desktop Edition
`;
    
    await fs.writeFile(path.join(this.packageDir, 'README.txt'), readme);
  }
}

// Main execution
async function main() {
  const creator = new DesktopPackageCreator();
  await creator.createDesktopPackage();
}

// Always run when executed directly
main().catch(console.error);

export { DesktopPackageCreator };
