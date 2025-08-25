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
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# 3. Make changes and test
# 4. Commit frequently to prevent work loss
git add . && git commit -m "Description" && git push origin v4.x
```

### **🆕 Dataset Separation System**
- **Development Datasets**: Located in `datasets-dev/` folder (isolated from builds)
- **Production Builds**: Clean `dist/` folder without development datasets
- **Custom Middleware**: Vite middleware serves development datasets during development
- **Identical Functionality**: All deployment types work identically despite different data sources

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
- **Dataset Management**: Automatic detection and loading of story data
- **Variable System**: Dynamic variable tracking and editing
- **Configuration System**: Flexible default settings with user overrides

### **Advanced Features**
- **Story Mode**: Streamlined reading experience with optional elements hidden
- **Search Functionality**: Node content search across entire projects
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Simple Logging**: User-controlled console log capture and save
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

### **Plugin System**
- **Plugin Discovery**: Automatic loading from `src/plugins/` directory
- **Plugin Interface**: Standardized API for consistent integration
- **Hot Reloading**: Development-time plugin updates without restart

## 📚 **Detailed Documentation**

For comprehensive technical details, see the feature-specific documentation:

### **Core Systems**
- **[Logging System](devdoc_logging.md)** - Simple console log capture and save system
- **[Plugin Architecture](devdoc_plugins.md)** - Plugin development and integration
- **[Dataset Management](devdoc_datasets.md)** - Data loading and detection systems
- **[Configuration System](devdoc_configuration.md)** - Settings and user preferences

### **Deployment & Distribution**
- **[Desktop Version](devdoc_desktop-version.md)** - Portable desktop app implementation
- **[File Protection](devdoc_fileprotection.md)** - Development stability and backup systems
- **[Cache Busting](FILE-PROTECTION-README.md)** - Development cache prevention (legacy)
- **[Testing Framework](README_old.md)** - Automated testing and verification (see sections in old README)

### **User Interface**
- **[Navigation System](README_old.md)** - Story flow and user interaction (see old README)
- **[Variables Panel](README_old.md)** - Variable management and editing (see old README)
- **[Story Mode](README_old.md)** - Reading experience optimization (see old README)

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
