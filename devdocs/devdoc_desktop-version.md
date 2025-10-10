# Portable Desktop Version

## 🎯 **Overview**

The Articy Web Viewer supports a portable desktop version that requires zero installation. Users simply download a ZIP file, extract it, and run a batch file to launch the application. This approach provides desktop convenience while maintaining the same codebase as the web version.

## 🏗️ **Architecture**

### **Core Concept**
Instead of using Electron (which adds 100-200MB overhead), the desktop version uses:
- **Portable PHP Server** - Serves both API endpoints and static files
- **Built Web Application** - Same React app as web version
- **Batch File Launcher** - Starts servers and opens browser automatically
- **Zero Installation** - Everything runs from extracted folder

### **Package Structure**
```
articy-desktop-viewer/
├── start-articy.bat           # Main launcher (double-click to run)
├── stop-articy.bat            # Stop servers and cleanup
├── app/                       # Built web application
│   ├── index.html             # Main application entry
│   ├── assets/                # CSS, JS, images
│   ├── datasets.php           # Dataset detection API
│   ├── append-log.php         # Real-time logging API
│   ├── cleanup-sessions.php   # Session management API
│   ├── save-log.php           # Legacy logging API
│   ├── myproject.json/        # User dataset folder (example)
│   │   ├── manifest.json      # 4.x format manifest
│   │   ├── global_variables.json
│   │   └── ...                # Other 4.x JSON files
│   └── myproject3x.json       # User 3.x dataset (single file)
├── php/                       # Portable PHP installation
│   ├── php.exe                # PHP executable
│   ├── php.ini                # PHP configuration
│   └── ext/                   # Required PHP extensions
├── logs/                      # Application logs (auto-created)
└── README.txt                 # User instructions
```

## 🔧 **Implementation Details**

### **Main Launcher Script**
```batch
@echo off
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
start /B "%APP_DIR%php\php.exe" -S localhost:%PORT% -t "%APP_DIR%app"

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open in browser
echo Opening Articy Web Viewer...
start http://localhost:%PORT%

echo.
echo ✅ Articy Web Viewer is running!
echo 🌐 URL: http://localhost:%PORT%
echo 📁 Datasets folder: %APP_DIR%datasets
echo 📝 Logs folder: %APP_DIR%logs
echo.
echo 💡 To add datasets:
echo    - Copy JSON files to the 'datasets' folder, OR
echo    - Drag and drop files directly into the web interface
echo.
echo ⚠️  Keep this window open while using the app
echo 🛑 Close this window or run stop-articy.bat to stop
echo.
pause
```

### **Cleanup Script**
```batch
@echo off
echo Stopping Articy Web Viewer...

REM Kill PHP processes
taskkill /F /IM php.exe 2>nul

REM Kill processes using ports 8080-8085
for /L %%i in (8080,1,8085) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":%%i" ^| find "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
)

echo ✅ Servers stopped successfully.
echo 📁 Your datasets and logs are preserved in their folders.
pause
```

## 📦 **Build Process**

### **Build Script (package.json)**
```json
{
  "scripts": {
    "build:desktop": "npm run build && node scripts/create-desktop-package.js"
  }
}
```

### **Desktop Package Creator**
```javascript
// scripts/create-desktop-package.js
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

async function createDesktopPackage() {
  const packageDir = 'desktop-package';
  const appDir = path.join(packageDir, 'app');
  
  console.log('🏗️ Creating desktop package...');
  
  // 1. Clean and create package directory
  await fs.remove(packageDir);
  await fs.ensureDir(appDir);
  
  // 2. Copy built web application
  console.log('📁 Copying built application...');
  await fs.copy('dist', appDir);
  
  // 3. Download portable PHP
  console.log('⬇️ Downloading portable PHP...');
  await downloadPortablePHP(path.join(packageDir, 'php'));
  
  // 4. Create launcher scripts
  console.log('📝 Creating launcher scripts...');
  await createLauncherScripts(packageDir);
  
  // 5. Copy sample datasets
  console.log('📊 Copying sample datasets...');
  await copySampleDatasets(path.join(packageDir, 'datasets'));
  
  // 6. Create user documentation
  console.log('📚 Creating user documentation...');
  await createUserDocumentation(packageDir);
  
  console.log('✅ Desktop package created successfully!');
  console.log(`📁 Package location: ${path.resolve(packageDir)}`);
}

async function downloadPortablePHP(phpDir) {
  // Download PHP 8.x portable version
  // Extract only essential files and extensions
  // Configure php.ini for local use
}

async function createLauncherScripts(packageDir) {
  // Create start-articy.bat
  // Create stop-articy.bat
  // Set appropriate permissions
}

async function copySampleDatasets(datasetsDir) {
  await fs.ensureDir(datasetsDir);
  
  // Copy demo datasets
  const sampleDatasets = [
    'public/demo.json',
    'public/demo4.json',
    'public/mpos.json'
  ];
  
  for (const dataset of sampleDatasets) {
    if (await fs.pathExists(dataset)) {
      await fs.copy(dataset, path.join(datasetsDir, path.basename(dataset)));
    }
  }
}

async function createUserDocumentation(packageDir) {
  const readme = `
Articy Web Viewer - Desktop Edition
===================================

QUICK START:
1. Double-click "start-articy.bat"
2. Your browser will open automatically
3. Start exploring your interactive stories!

ADDING YOUR OWN DATASETS:
- Copy JSON files to the "datasets" folder, OR
- Drag and drop files directly into the web interface

STOPPING THE APPLICATION:
- Close the command window, OR
- Double-click "stop-articy.bat"

TROUBLESHOOTING:
- If port 8080 is busy, the app will try 8081 automatically
- Check the command window for any error messages
- Your datasets and logs are preserved between sessions

For more help, visit: https://github.com/chad-ld/articy-webpreview
`;
  
  await fs.writeFile(path.join(packageDir, 'README.txt'), readme);
}

if (require.main === module) {
  createDesktopPackage().catch(console.error);
}

module.exports = { createDesktopPackage };
```

## 🎯 **User Experience**

### **Installation Process**
1. **Download** - Single ZIP file (~30-50MB)
2. **Extract** - Unzip to any location (Desktop, Documents, USB drive)
3. **Run** - Double-click `start-articy.bat`
4. **Automatic** - Browser opens to the application

### **Daily Usage**
1. **Start** - Double-click launcher (remembers previous session)
2. **Use** - Identical interface to web version
3. **Add Datasets** - Copy your Articy JSON folders to the `app` directory or drag-drop
4. **Stop** - Close command window or run stop script

### **No Installation Required**
- **No Admin Rights** - Runs from user folder
- **No Registry Changes** - Completely portable
- **No System Dependencies** - Everything included
- **USB Portable** - Can run from removable media

## 🔧 **Technical Specifications**

### **Portable PHP Configuration**
```ini
; php.ini optimized for desktop use
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 100M
post_max_size = 100M
extension_dir = "./ext"

; Enable required extensions
extension=json
extension=mbstring
extension=fileinfo
extension=openssl
```

### **Server Configuration**
- **PHP Built-in Server** - `php -S localhost:8080`
- **Document Root** - Points to built application folder
- **API Endpoints** - Same PHP files as web version
- **Port Detection** - Automatic fallback if 8080 is busy

### **File System Integration**
- **Dataset Detection** - Scans local datasets folder
- **Drag-and-Drop** - Browser file API for additional files
- **Log Management** - Local logs folder for session data
- **Asset Loading** - Direct file system access for plugins

## 📊 **Package Size Comparison**

| Component | Size | Notes |
|-----------|------|-------|
| **Portable PHP** | ~20MB | Essential extensions only |
| **Built Web App** | ~10MB | Optimized production build |
| **Scripts & Docs** | ~1MB | Launchers and user guide |
| **Total Package** | **~30MB** | vs 100-200MB for Electron |

## 🚀 **Distribution Strategy**

### **GitHub Releases**
```bash
# Create desktop package
npm run build:desktop

# Manually create ZIP when ready for distribution
# From builds/ folder: articy-desktop-viewer-v4.x/
# Create ZIP: articy-desktop-viewer-v4.x.zip

# Upload to GitHub releases
# Tag: v4.x-desktop
# Asset: articy-desktop-viewer-v4.x.zip
```

### **User Instructions**
```
Articy Web Viewer - Desktop Edition

DOWNLOAD & RUN:
1. Download articy-desktop-viewer.zip from GitHub releases
2. Extract to any folder (Desktop, Documents, etc.)
3. Double-click start-articy.bat
4. Browser opens automatically - you're ready to go!

FEATURES:
✅ No installation required
✅ Works offline
✅ Same features as web version
✅ Real-time logging and session management
✅ Full plugin support
✅ Drag-and-drop dataset loading

SYSTEM REQUIREMENTS:
- Windows 7 or later
- Any modern web browser
- ~50MB free disk space
```

## 🔄 **Maintenance & Updates**

### **Update Process**
1. **Build New Version** - `npm run build:desktop`
2. **Create ZIP** - Manually zip the builds/ folder when ready
3. **Release on GitHub** - Upload new ZIP file
4. **User Updates** - Download and extract over existing folder
5. **Data Preservation** - User datasets and logs are preserved

### **Backward Compatibility**
- **Dataset Folder** - Always preserved during updates
- **Log Files** - Maintained across versions
- **User Preferences** - Stored in browser localStorage
- **Plugin Data** - Preserved in application data

---

> **💡 Advantage**: This approach provides 90% of desktop app benefits with 10% of the complexity compared to Electron, while maintaining perfect feature parity with the web version.
