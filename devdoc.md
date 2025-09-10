# Developer Documentation

## 🎯 **Project Overview**

The Articy Web Viewer is a modern React-based application that allows web browser preview of Articy Draft narrative projects. It supports both Articy Draft 3.x and 4.x formats with a plugin architecture for extensibility.

### **Core Architecture**
- **Frontend**: React + TypeScript + Vite
- **Backend**: PHP for server-side operations (dataset detection, logging)
- **Deployment**: Dual deployment (web server + local EXE)
- **Data Sources**: JSON files from Articy Draft exports

## 🚀 **Development Best Practices**

### **Getting Started**
1. **Always use safe mode**: `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1`
2. **Check file integrity**: `npm run check:integrity` before starting work
3. **Test cache system**: `npm run test:cache` to verify configuration
4. **Never push without permission**: Always ask before git push operations

### **Development Workflow**
```bash
# 1. Check system health
npm run check:integrity

# 2. Start development (REQUIRED - not npm run dev)
# Launch the start_dev_sever.bat in an external terminal window. 
# For developer reference, that batch file simply runs this command:
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# 3. Make changes and test
# 4. Commit frequently to prevent work loss. Unless directly specified to in prompt, ALWAYS ask before commiting or pushing any data. 
git add . && git commit -m "Description" && git push origin v4.x
```

### **🆕 Dataset Separation System**
- **Development Datasets**: Located in `datasets-dev/` folder (isolated from builds)
- **Production Builds**: Clean `dist/` folder with empty `datasets/` folder for user files
- **Custom Middleware**: Vite middleware serves development datasets during development
- **Identical Functionality**: All deployment types work identically despite different data sources
- **User-Friendly Setup**: Empty `datasets/` folder with README instructions automatically created

### **File Protection System**
- **Safe Mode**: Prevents file reversion issues through cache disabling and polling
- **Backup System**: Critical files have `.backup` versions for automatic restoration
- **Integrity Checking**: Automated verification of core functionality

## 📋 **Feature Overview**

### **Core Features**
- **Dual Format Support**: Articy 3.x and 4.x JSON formats
- **Interactive Navigation**: Choice-based story progression with history
- **Plugin Architecture**: Extensible system for custom functionality
- **Simple Console Logging**: One-click console log capture and save
- **Dataset Management**: Simplified environment-based data loading (dev/production separation)
- **Variable System**: Dynamic variable tracking and editing
- **Configuration System**: Auto-loading datasets, plugin defaults, and deployment customization ✅

### **Advanced Features**
- **Story Mode**: Streamlined reading experience with optional elements hidden
- **Search Functionality**: Node content search across entire projects
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Cache Busting**: Comprehensive development cache prevention

### **Deployment Options**
- **Web Version**: Server-hosted with PHP backend for dynamic dataset detection
- **Desktop Version**: ✅ **IMPLEMENTED** - Zero-installation portable app using PHP server
- **Unified Codebase**: Single codebase supports both web and desktop deployment

## 🔧 **Technical Architecture**

### **Frontend Components**
- **App.tsx**: Main application container and state management
- **LoadingScreen.tsx**: Dataset selection and configuration interface
- **NodeRenderer.tsx**: Core story node display and interaction
- **VariablesPanel.tsx**: Variable viewing and editing interface

### **Core Utilities**
- **hybridDatasetDetector.js**: Automatic dataset discovery and loading
- **consoleLogger.ts**: Simple console log capture and batch save system
- **configManager.ts**: Configuration loading and persistence
- **nodeProcessor.ts**: Story node parsing and processing

### **Plugin System** ✅ **COMPLETE**
- **Plugin Separation**: Plugins built separately from main application
- **Dynamic Loading**: Runtime plugin loading from external files in production
- **Development Mode**: Bundled plugins with hot reloading for development
- **Post-Build Customization**: Add/remove plugins without rebuilding application
- **Config Integration**: Plugin defaults controlled via config.json
- **Dual Deployment**: Identical plugin system for web and desktop versions
- **UMD Format**: Plugins use Universal Module Definition with React/Antd globals
- **Auto-Discovery**: Automatic plugin detection and manifest generation

## 📚 **Detailed Documentation**

For comprehensive technical details, see the feature-specific documentation:

### **Core Systems**
- **[Logging System](devdoc_logging.md)** - Simple console log capture and save system
- **[Plugin Architecture](devdoc_plugins.md)** - Plugin development and integration
- **[Dataset Management](devdoc_datasets.md)** - Data loading and detection systems
- **[Configuration System](devdoc_configuration.md)** - Settings and user preferences
- **[Choice Sorting](devdoc_sorting.md)** - Multiple-choice sorting by Y position

### **Deployment & Distribution**
- **[Desktop Version](devdoc_desktop-version.md)** - Portable desktop app implementation
- **[File Protection](devdoc_fileprotection.md)** - Development stability and backup systems

## ⚠️ **Critical Guidelines**

### **File Integrity**
- **Never use basic `npm run dev`** - always use safe mode
- **Monitor critical files**: `vite.config.ts`, `hybridDatasetDetector.js`
- **Check integrity regularly**: Run `npm run check:integrity` before major work

### **Git & Repository**
- **Ask before pushing**: Never push without explicit permission
- **Commit frequently**: Prevent work loss through regular commits
- **Use descriptive messages**: Clear commit descriptions for tracking

### **Development Environment**
- **PHP Server Required**: Many features need PHP proxy for server operations
- **Cache Prevention**: Safe mode prevents development cache issues
- **Simple Logging**: Floating button for on-demand log capture and save

## 🛡️ **Cache Busting Features by Environment**

### **1. Development Server (Unbuilt Files)**
- **Command**: `powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1`
- **Cache Busting**: ✅ **FULL PROTECTION**
  - Vite cache disabled (`cacheDir: false`)
  - HMR overlay disabled (prevents cache UI corruption)
  - File watching with polling (reliable change detection)
  - File integrity checking before startup
  - Automatic server cleanup and port management
- **Best For**: Active development and debugging

### **2. Web Build Test Server (Built Files)**
- **Command**: `npm run build:test`
- **Cache Busting**: ✅ **TESTING PROTECTION**
  - PHP opcache disabled for fresh execution
  - Cache-control headers on PHP responses
  - Automatic cache-busting configuration
  - Temporary files cleaned up on exit
- **Best For**: Testing production builds before deployment

### **3. Desktop Version Server (Portable)**
- **Command**: `start-articy.bat` (in desktop package)
- **Cache Busting**: ⚠️ **BASIC** (standard PHP server)
- **Best For**: End-user distribution (caching is actually desired for performance)

## 📊 **Test Environment Comparison Table**

| Feature | Development Server | Web Build Test Server | Desktop Version |
|---------|-------------------|----------------------|-----------------|
| **Command** | `start-dev-safe.ps1` | `npm run build:test` | `start-articy.bat` |
| **Purpose** | Active development | Production build testing | End-user distribution |
| **Source Files** | Unbuilt (`src/`) | Built (`dist/`) | Built (`app/`) |
| **Dataset Folder** | `datasets-dev/` | `dist/datasets/` | `app/datasets/` |
| **Default Port** | 3000 (Vite) + 8080 (PHP) | 8082 | 8080 |
| **PHP Server** | System PHP | Portable PHP | Bundled PHP |
| **Cache Busting** | ✅ Full (Vite + integrity) | ✅ Testing (headers + opcache) | ⚠️ Basic (standard) |
| **Hot Reloading** | ✅ Yes (Vite HMR) | ❌ No | ❌ No |
| **File Protection** | ✅ Integrity checking | ❌ No | ❌ No |
| **Auto Cleanup** | ✅ Yes | ✅ Yes | ⚠️ Manual |
| **Browser Auto-Open** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Port Fallback** | ✅ Yes | ✅ Yes | ✅ Limited |
| **Best Use Case** | Development & debugging | Pre-deployment testing | User distribution |

### **Production Testing**
- **Dist Testing Server**: `start-dist-server.ps1` serves built application with portable PHP
- **Automatic Port Selection**: Finds available ports (8082, 8083, 8084, etc.)
- **Demo Dataset Setup**: Automatically copies demo datasets for testing
- **Environment Detection**: Tests production plugin loading and configuration
- **Web Server Configuration**: `.htaccess` file automatically created for Apache/web server deployment

## 🖥️ **Desktop Version Implementation** ✅

### **Portable Desktop App - COMPLETED**
The project now includes a fully functional zero-installation desktop version:

- **✅ Portable PHP Server**: Uses portable PHP + batch scripts instead of Electron
- **✅ Zero Installation**: Users download ZIP, extract, and run - no admin rights needed
- **✅ Same Codebase**: Identical functionality to web version with shared code
- **✅ Small Package**: ~35MB total vs 100-200MB for Electron alternatives

### **Implementation Status - COMPLETE**
- **✅ Environment Detection**: Detects portable desktop vs web vs development environments
- **✅ Build Scripts**: Automated desktop packaging with `npm run build:desktop`
- **✅ Distribution**: ZIP packaging with `npm run package:desktop`
- **✅ User Experience**: Double-click launcher opens browser automatically
- **✅ Dataset Management**: Users copy datasets to app directory for direct serving

### **Quick Desktop Build**
```bash
# Build desktop package
npm run build:desktop

# Create distribution ZIP
npm run package:desktop
```

See **[Desktop Version Documentation](devdoc_desktop-version.md)** for complete implementation details.

## 🧪 **Testing & Verification**

### **Automated Tests**
- **Cache Configuration**: `npm run test:cache` - Verifies 12 cache prevention features
- **Runtime Behavior**: `npm run test:runtime` - Tests live server behavior
- **File Integrity**: `npm run check:integrity` - Validates critical files

### **Manual Testing**
- **Dataset Loading**: Test both 3.x and 4.x format support
- **Plugin Functionality**: Verify all plugins load and function correctly
- **Navigation Flow**: Test story progression and choice handling
- **Variable System**: Verify variable tracking and editing

## 🔨 **Build System**

### **Available Build Commands**
```bash
# Development
npm run dev:safe                # Safe development server (REQUIRED)
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1  # Alternative

# Production Builds
npm run build                   # Full build (app + plugins + config)
npm run build:plugins          # Plugins only (separate compilation)
npm run build:serve            # Build and serve locally for testing (requires system PHP)
npm run build:test             # Build and serve with portable PHP + cache busting

# Desktop Distribution
npm run build:desktop          # Create portable desktop package (outputs to builds/ folder)

# Testing & Verification
npm run check:integrity        # Validate critical files
npm run test:cache             # Test cache prevention
npm run test:runtime           # Test live server behavior

# Development Tools
npm run clean                  # Clean build artifacts and cache
npm run cleanup:servers        # Stop all development servers
npm run lint                   # Check code quality
npm run lint:fix               # Fix linting issues automatically
npm run type-check             # TypeScript type checking
```

### **Testing Built Applications**
Before deploying to production, always test the built application locally:

```bash
# Method 1: Using portable PHP (recommended)
npm run build:test             # Builds and serves with portable PHP

# Method 2: Using system PHP (if available)
npm run build:serve            # Requires PHP in system PATH

# Method 3: Manual testing
npm run build                  # Build the application
powershell -ExecutionPolicy Bypass -File start-dist-server.ps1  # Start test server
```

**Testing Features to Verify:**
- ✅ Application loads without errors
- ✅ Plugin loading from `dist/plugins/` directory
- ✅ Dataset detection via `datasets.php`
- ✅ Config.json loading and runtime configuration
- ✅ Console logging endpoints (`save-log.php`)
- ✅ All PHP endpoints respond correctly

### **Plugin Build System**
The plugin system now uses **separated builds** for maximum flexibility:

- **Development**: Plugins bundled with hot-reloading
- **Production**: Plugins compiled separately to `dist/plugins/`
- **Post-Build**: Add/remove plugins without rebuilding application
- **Config-Driven**: Plugin defaults controlled via `config.json`

### **Deployment Structure**
```
dist/                          # Web deployment
├── index.html
├── assets/
├── config.json               # Runtime configuration
├── plugins/                  # Separate plugin files
│   ├── mysteryworks-murderboard.js
│   ├── hello-world.js
│   └── plugins.json         # Plugin manifest
└── datasets.php

builds/articy-desktop-*/       # Desktop deployment
├── app/                      # Same as dist/
├── php/                      # Portable PHP
└── datasets/                 # Sample datasets
```

## 🎯 **Current Development Status**

### **Plugin System - COMPLETE** ✅
- **Dynamic Plugin Loading**: Plugins load from separate files post-build
- **Plugin UI Integration**: Loading screen plugin selection working
- **Build Separation**: Plugins compile independently from main application
- **Configuration System**: Runtime plugin defaults via config.json
- **Development Workflow**: Hot-reloading and development experience maintained

### **Dataset Management - COMPLETE** ✅
- **Hybrid Detection**: PHP API + JavaScript fallback for maximum compatibility
- **Environment Isolation**: Clean separation between development and production datasets
- **Auto-Loading**: Configuration-driven dataset loading with skip loading screen option
- **Format Support**: Full 3.x and 4.x Articy Draft format compatibility

### **Deployment System - COMPLETE** ✅
- **Web Deployment**: Single dist/ folder with all dependencies
- **Desktop Deployment**: Portable PHP + identical codebase
- **Configuration Management**: Runtime config changes without rebuilding
- **Testing Infrastructure**: Local production testing with portable PHP

### **Latest Update: Relative Path Fixes (August 26, 2025)** ✅
- **Issue Resolved**: Fixed absolute path issues (`/datasets/`, `/plugins/`) that caused failures on web servers
- **Dataset Paths**: Updated `datasets.php` to return relative paths (`./datasets/...`)
- **Plugin Paths**: Updated plugin discovery to use relative paths (`./plugins/...`)
- **Apache Rules**: Enhanced `.htaccess` to support dataset directories
- **Build Integration**: All fixes integrated into source files for automatic inclusion in builds
- **Verification**: Complete testing confirms dataset loading and plugin system operational

## 📞 **Support & Troubleshooting**

### **Common Issues**
- **File Reversion**: Use safe mode to prevent, run integrity check to fix
- **Cache Problems**: Clear cache and restart with safe mode
- **PHP Proxy Issues**: Verify server is running and proxy configuration

### **Debug Resources**
- **Console Logging**: Use floating log button to capture and save console output
- **Log Files**: Check `logs/` directory for saved console log files
- **Browser Console**: Monitor real-time console output during development

---

> **💡 Remember**: This project prioritizes stability and reliability. Always use safe mode for development and check file integrity regularly to prevent work loss.
