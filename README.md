# Articy Web Viewer v4.x

A modern React-based web viewer for Articy Draft projects that allows anyone with a web browser to preview and interact with your narrative flows without needing Articy installed.

🌐 **Live Demo**: https://dev.chadbriggs.com/articy/v4/

## ✨ **Key Features**

### **Dual Format Support**
- **Articy Draft 3.x** - Single JSON file format
- **Articy Draft X (4.x)** - Multi-file JSON format with manifest
- **Automatic Detection** - Seamlessly handles both formats

### **Smart Dataset Loading**
- **Dynamic Detection** - Automatically finds datasets on server
- **Drag & Drop** - Load files directly into the browser
- **Version Tags** - Visual indicators for 3.x vs 4.x formats
- **Metadata Display** - Shows project names, timestamps, and descriptions

### **Interactive Navigation**
- **All Node Types** - Instructions, dialogues, choices, conditions, hubs
- **Custom Templates** - Supports user-defined node templates
- **Variable Processing** - Real-time variable tracking and updates
- **Condition Evaluation** - Dynamic choice enabling/disabling
- **Flow Fragments** - Proper sub-flow handling

### **Modern UI**
- **React + TypeScript** - Modern, maintainable codebase
- **Ant Design** - Professional UI components
- **Responsive Design** - Works on desktop and mobile
- **Variables Panel** - Collapsible sidebar with search and editing
- **Search Panel** - Find nodes by content across the entire project

## 🚀 **Quick Start**

### **For End Users**
1. Visit https://dev.chadbriggs.com/articy/v4/
2. Either:
   - **Select from dropdown** - Choose from auto-detected datasets
   - **Drag & drop** - Drop your JSON files directly onto the page
3. Navigate through your story using the interactive interface

### **For Developers**
```bash
# Clone the repository
git clone https://github.com/chad-ld/articy-webpreview.git
cd articy-webpreview

# Install dependencies
npm install

# Start development server (with file integrity protection)
npm run dev:safe

# Or start with PHP support for dataset detection
npm run dev:php
```

## 📋 **Requirements**

### **For Articy Projects**
- **Articy Draft 3.x** OR **Articy Draft X (4.x)**
- JSON export from your Articy project
- **Start Node**: Create an instruction node with `//HTMLPREVIEW` comment

### **For Development**
- **Node.js** 16+ and npm
- **PHP** (optional, for server-side dataset detection)
- **Modern browser** with ES6+ support

## 🔧 **Development Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Standard Vite development server |
| `npm run dev:safe` | **Recommended**: Development with file integrity checking and cache protection |
| `npm run dev:php` | Development with PHP server for dataset detection |
| `npm run build` | Build for production deployment |
| `npm run check:integrity` | Verify critical files haven't been corrupted |
| `npm run test:cache` | **Testing**: Run 12 cache busting configuration tests |
| `npm run test:runtime` | **Testing**: Test live cache behavior while server is running |

## 📁 **Project Structure**

```
articy-webpreview/
├── src/
│   ├── components/          # React components
│   │   ├── InteractiveArticyViewer.tsx
│   │   ├── VariablesPanel.tsx
│   │   └── SearchNodesPanel.tsx
│   ├── panels/              # Node type panels
│   │   ├── InstructionPanel.tsx
│   │   ├── QuestionPanel.tsx
│   │   └── EndOfFlowPanel.tsx
│   └── utils/               # Core utilities
│       ├── hybridDatasetDetector.js
│       ├── dataRouter.js
│       └── formatDetector.js
├── public/                  # Static assets and demo datasets
├── php-api/                 # Server-side dataset detection
├── builds/                  # Production builds
└── docs/                    # Documentation
```

## 🎮 **Usage Guide**

### **Exporting from Articy**

1. **Create Start Node**: Add an instruction node with `//HTMLPREVIEW` in the text
2. **Export Project**: File → Export → JSON format
3. **Upload Files**: 
   - **3.x**: Upload the single `.json` file
   - **4.x**: Upload the entire folder (contains `manifest.json`)

### **Navigation Controls**

- **Mouse/Touch**: Click choices and buttons
- **Keyboard**: Arrow keys + Enter for navigation
- **Shortcuts**:
  - `Ctrl+R` - Restart story
  - `Ctrl+L` - Return to file loading screen

### **Variables Panel**

- **Toggle**: Click the variables button to show/hide
- **Search**: Filter variables by name or value
- **Edit**: Right-click (desktop) or long-press (mobile) to edit values
- **Import**: Drag TXT or CSV files to bulk update variables

## 🔄 **Dual Deployment Architecture**

This project supports two deployment targets from a single codebase:

### **Web Version** (Current)
- **Server**: DreamHost shared hosting
- **Detection**: PHP script scans for uploaded datasets
- **URL**: https://dev.chadbriggs.com/articy/v4/

### **Desktop EXE Version** (Planned)
- **Platform**: Electron-based desktop application
- **Detection**: Local folder scanning + drag-and-drop
- **Distribution**: Single executable file

## 👨‍💻 **Developer Notes**

### **🚀 Quick Start for Developers**

```bash
# 1. Check system health
npm run check:integrity

# 2. Test cache configuration
npm run test:cache

# 3. Start development safely
npm run dev:safe

# 4. Test runtime behavior (in another terminal)
npm run test:runtime
```

### **⚠️ Important Development Guidelines**

#### **Git & Repository Management**
- **🚨 ALWAYS ASK BEFORE PUSHING**: Never push to local git or remote repository without explicit permission from the project maintainer
- **Branch Safety**: Currently working on `v4.x` branch - ensure you're on the correct branch before making changes
- **Commit Frequently**: Make small, frequent commits during development to prevent work loss

#### **Server Process Management**
- **Kill Existing Processes**: Always terminate running web server processes before starting new ones
- **Automatic Cleanup**: The development scripts (`start-dev-safe.ps1`, `start-dev-with-php.ps1`) automatically handle process cleanup when stopped with `Ctrl+C`
- **Manual Cleanup**: If processes get stuck, manually kill PHP and Node processes:
  ```bash
  # Kill PHP processes
  taskkill /F /IM php.exe

  # Kill Node processes
  taskkill /F /IM node.exe
  ```

#### **Log Files & Debugging**
- **Log Location**: Development and debugging logs are stored in the `logs/` folder
- **Console Exports**: Browser console exports saved as `logs/console-export-YYYY-MM-DD_HH-MM-SS.txt`
- **Investigation Logs**: Specific debugging logs like `fallback-detection-debug.log`, `work-loss-investigation.log`
- **Log Cleanup**: Excessive logs are automatically cleaned during project maintenance

#### **File Integrity Protection**
- **Always Run**: Use `npm run dev:safe` instead of `npm run dev` to enable file protection
- **Check Integrity**: Run `npm run check:integrity` before starting development sessions
- **Backup System**: Critical files have `.backup` versions that are automatically restored if corruption is detected

#### **Cache Busting Verification**
- **Test Configuration**: Run `npm run test:cache` to verify all cache prevention features
- **Test Runtime**: Run `npm run test:runtime` while server is running to check live behavior
- **Monitor Performance**: Tests verify minimal cache accumulation and fast file detection

## 🧪 **Cache Busting & Testing**

This project includes comprehensive cache prevention and testing systems to ensure reliable development without file reversion issues.

### **Cache Prevention Features**

- **Vite Cache Disabled**: `cacheDir: false` prevents internal caching
- **HMR Overlay Disabled**: Prevents cache-related UI corruption
- **File Watching with Polling**: Reliable change detection every 100ms
- **Cache-Busting Parameters**: Dynamic timestamps in data loading
- **File Integrity Protection**: Automatic backup/restore system

### **Testing Commands**

```bash
# Test all cache busting configuration
npm run test:cache

# Test runtime cache behavior (while server is running)
npm run test:runtime

# Check file integrity and restore if needed
npm run check:integrity
```

### **Cache Test Results**

The `npm run test:cache` command runs 12 comprehensive tests:

- ✅ **Vite Cache Disabled** - Configuration verification
- ✅ **HMR Overlay Disabled** - UI protection active
- ✅ **File Watching Uses Polling** - Reliable change detection
- ✅ **Vite Cache Directory Status** - Minimal cache files present
- ✅ **Backup Files Exist** - Protection system ready
- ✅ **Integrity Checker Works** - Restoration system functional
- ✅ **HybridDatasetDetector Methods** - Core functionality intact
- ✅ **PHP Proxy Configuration** - API routing configured
- ✅ **Cache Busting in App** - Dynamic timestamps implemented
- ✅ **Safe Mode Scripts** - Development tools available
- ✅ **File Modification Detection** - Sub-second change detection
- ✅ **Memory Cache Management** - Proper cache lifecycle

### **Runtime Testing**

The `npm run test:runtime` command verifies live server behavior:

- **Server Status**: Confirms development server is running on port 3000
- **PHP Integration**: Verifies PHP server on port 8080 with proxy
- **Process Health**: Monitors Node.js memory usage and process count
- **Cache Directory**: Ensures minimal cache file accumulation
- **File Detection**: Tests real-time file modification detection

### **Manual Browser Testing**

For complete verification:

1. **Start Server**: `npm run dev:safe`
2. **Open Browser**: http://localhost:3000/
3. **Open Dev Tools**: F12 → Network tab
4. **Edit Source File**: Make changes and save
5. **Verify Hot Reload**: Page updates automatically
6. **Check Network Tab**: Look for cache-busting parameters (`?v=timestamp`)

## ⚠️ **Known Issues & Solutions**

### **File Reversion Problem**
During development, critical files occasionally revert to older versions. This project includes a protection system:

```bash
# Always check file integrity before development
npm run check:integrity

# Use the safe development script
npm run dev:safe
```

### **Cache Issues Troubleshooting**

If you experience slow file updates or caching problems:

```bash
# 1. Test cache configuration
npm run test:cache

# 2. Check runtime behavior
npm run test:runtime

# 3. Clear any accumulated cache
npm run clean

# 4. Restart with safe mode
npm run dev:safe
```

**Expected Test Results:**
- Cache tests should show 11/12 or 12/12 passing
- Runtime tests should show all servers running
- File modification detection should be under 2 seconds
- Cache directory should have fewer than 50 files

### **PHP Proxy Issues**
If PHP detection isn't working in development:

1. Ensure PHP is installed and in PATH
2. Use `npm run dev:php` instead of `npm run dev`
3. Check that `vite.config.ts` has proxy configuration

## 📚 **Documentation**

- **[Dual Deployment Plan](dual-deployment-plan.md)** - Technical architecture details
- **[File Protection System](FILE-PROTECTION-README.md)** - Development stability guide
- **[SFTP Setup Guide](SFTP_Setup_Guide.md)** - Deployment configuration

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Run `npm run check:integrity` before starting
4. Make your changes
5. Test with both 3.x and 4.x datasets
6. Submit a pull request

## 📄 **License**

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Articy Software** - For creating the excellent narrative design tool
- **React Community** - For the robust framework and ecosystem
- **Ant Design** - For the beautiful UI components

---

**Need help?** Open an issue on GitHub or visit the live demo to see the viewer in action.
