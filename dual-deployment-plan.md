# Articy Web Viewer - Dual Deployment Plan

## 🎯 Project Overview

Create a unified codebase that supports two deployment targets:
1. **Web Server Version** - Dynamic dataset detection from server folder
2. **Desktop EXE Version** - User-selected folder scanning + drag-and-drop

Both versions use the same HTML interface and maintain feature parity.

## 🏗️ Architecture

### Current Hybrid Detection System
```
HybridDatasetDetector
├── Web: Server-side folder scanning (PHP/Python API)
├── EXE: Local folder scanning (Electron file system)
├── Both: Drag-and-drop file loading
└── Fallback: Predefined dataset list
```

### Environment Auto-Detection
- **Web Browser**: Uses server API for dynamic folder scanning
- **Electron App**: Uses native file system for local folder scanning
- **Automatic switching**: No manual configuration required

## 🔧 Implementation Details

### Web Server Version
- **Server Script**: PHP (current) for dataset detection
- **Dynamic Scanning**: Automatically detects uploaded/removed JSON files
- **Deployment**: DreamHost shared hosting (dev.chadbriggs.com/articy/v4)
- **User Workflow**: Upload files → Auto-detected in dropdown

### Desktop EXE Version  
- **Primary Method**: User selects local folder containing datasets
- **Secondary Method**: Drag-and-drop individual files
- **File Access**: Native Electron file system APIs
- **User Workflow**: Select folder OR drag files → Scan and display

### Shared Features
- ✅ Same HTML/CSS/JavaScript interface
- ✅ Same dataset detection logic
- ✅ Same JSON parsing and display
- ✅ Same version tags (3.x/4.x) and subtitles
- ✅ Same sorting and filtering
- ✅ Drag-and-drop support in both versions

## 🚀 Development Workflow

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",                    // Web development
    "dev:electron": "electron .",     // EXE development  
    "build:web": "vite build",        // Web deployment
    "build:electron": "electron-builder", // EXE distribution
    "test:both": "npm run dev & npm run dev:electron"
  }
}
```

### Testing During Development
```bash
# Test web version (server scanning)
npm run dev

# Test EXE version (folder selection + drag-drop)  
npm run dev:electron

# Force specific detection methods (development only)
npm run dev -- --mode=fallback
npm run dev -- --mode=dragdrop
```

## 🔄 Current Issues to Resolve

### 1. Missing Method Error
**Issue**: `hybridDetector.getLastSuccessfulMethod is not a function`
**Fix**: Add missing method to HybridDatasetDetector class
**Priority**: High (blocks all detection)

### 2. PHP Execution in Development
**Issue**: Vite dev server serves PHP as static files instead of executing
**Options**: 
- Accept fallback mode for local development
- Set up local PHP server (XAMPP/WAMP)
- Test directly on DreamHost server

### 3. Electron File System Implementation
**Issue**: `detectViaFileSystem()` method incomplete
**Fix**: Complete native file system scanning for EXE version
**Priority**: Medium (needed for EXE functionality)

## 📋 Implementation Phases

### Phase 1: Fix Current Web Version (Immediate)
- [ ] Add missing `getLastSuccessfulMethod()` method
- [ ] Restore enhanced fallback detection with timestamps
- [ ] Test PHP API on actual DreamHost server
- [ ] Verify all 7 datasets detected with proper metadata

### Phase 2: Complete EXE Version (Next)
- [ ] Implement folder selection dialog in Electron
- [ ] Complete `detectViaFileSystem()` method
- [ ] Add folder scanning with same logic as PHP script
- [ ] Test drag-and-drop functionality in EXE

### Phase 3: Unified Testing (Final)
- [ ] Test feature parity between web and EXE versions
- [ ] Verify identical dataset detection results
- [ ] Test switching between deployment targets
- [ ] Document deployment procedures

## 🎮 User Experience

### Web Version Users
1. Navigate to dev.chadbriggs.com/articy/v4
2. See dropdown with auto-detected datasets from server
3. Can drag additional files for immediate loading
4. Upload new files to server → automatically appear in dropdown

### EXE Version Users  
1. Download and run desktop application
2. **Option A**: Click "Select Folder" → Choose dataset directory
3. **Option B**: Drag JSON files/folders onto application window
4. **Option C**: Mix both approaches (folder + additional dragged files)
5. Same interface and functionality as web version

## 🔧 Technical Specifications

### File Detection Logic (Both Versions)
- **4.x Format**: Folders ending in `.json` with `manifest.json` inside
- **3.x Format**: Single `.json` files with Packages/Project/GlobalVariables
- **Version Tags**: Extract from Settings.ExportVersion
- **Subtitles**: Parse HTMLPREVIEW comments for project sub-names
- **Timestamps**: Real file modification times (not detection time)

### Response Format (Standardized)
```json
{
  "success": true,
  "datasets": [
    {
      "name": "mpos",
      "folder": "mpos.json",           // 4.x format
      "file": "mystory.json",          // 3.x format  
      "displayName": "Project Name",
      "description": "Project description",
      "articyVersion": "4.x v2.1",
      "format": "4.x",
      "lastModified": 1750719258643,
      "lastModifiedFormatted": "6/23/2025, 5:54:18 PM"
    }
  ]
}
```

## ✅ Success Criteria

### Web Version
- [ ] Dynamic detection of uploaded/removed files
- [ ] Real file timestamps (not current time)
- [ ] All dataset metadata extracted correctly
- [ ] Drag-and-drop works as backup method

### EXE Version  
- [ ] Folder selection dialog functional
- [ ] Local folder scanning matches server results
- [ ] Drag-and-drop works independently
- [ ] Same UI and features as web version

### Both Versions
- [ ] Identical dataset detection results
- [ ] Same JSON response format
- [ ] Feature parity maintained
- [ ] Seamless development switching

## �️ Development Stability Protocols

### Work Loss Prevention
**Issue**: Changes keep getting reverted during development/testing
**Root Cause**: Unknown - needs investigation

### Mandatory Safety Checklist
```bash
# Before ANY testing session:
1. git status                           # Check for uncommitted changes
2. git add . && git commit -m "Save state before testing [timestamp]"
3. git push origin v4.x                 # Backup to remote
4. Close all other terminals/browsers   # Single development instance
5. npm run clean                        # Clear caches

# During development:
6. Make ONE change at a time
7. Test immediately
8. git add . && git commit -m "Working: [specific change]"

# After testing:
9. git status                           # Verify no unexpected changes
10. git diff HEAD~1                     # Check what actually changed
```

### Enhanced Package.json Scripts
```json
{
  "scripts": {
    "clean": "rm -rf node_modules/.vite && rm -rf dist",
    "dev:safe": "git status && npm run clean && npm run dev",
    "dev:electron:safe": "git status && npm run clean && npm run dev:electron",
    "commit:checkpoint": "git add . && git commit -m 'Checkpoint: $(date)'",
    "status:check": "git status && git log --oneline -5"
  }
}
```

### File System Monitoring
- [ ] Check for OneDrive/Dropbox/Google Drive sync conflicts
- [ ] Verify no IDE auto-revert extensions active
- [ ] Monitor for multiple Node.js processes
- [ ] Watch for HMR (Hot Module Replacement) conflicts

### Investigation Protocol
1. **Document every reversion** with timestamps and affected files
2. **Check git log** immediately after reversions occur
3. **Monitor file system** during switching operations
4. **Test with minimal changes** to isolate the trigger

## �🚀 Deployment Strategy

### Web Deployment
- Build: `npm run build:web`
- Upload: SFTP to DreamHost (existing batch file)
- Test: Verify PHP script execution on server

### EXE Distribution
- Build: `npm run build:electron`
- Package: Electron-builder creates installer
- Distribute: Single executable file

### Maintenance
- Single codebase for both versions
- Shared bug fixes and feature updates
- Environment-specific testing procedures
- **Aggressive version control** during development
