# Articy Web Viewer v4.x

A modern React-based web viewer for Articy Draft projects that allows anyone with a web browser to preview and interact with your narrative flows without needing Articy installed.

🌐 **Live Demo**: https://dev.chadbriggs.com/articy/v4/

> **🚀 For Developers**: Always use `npm run dev:safe` for development. This mode includes comprehensive cache protection, file integrity checking, and prevents the file reversion issues that can occur with standard development servers.

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

### **Plugin System**
- **Auto-Discovery** - Plugins automatically detected from `src/plugins/` folder
- **User Selection** - Enable/disable plugins on loading screen
- **Dynamic Loading** - Plugins only load when selected by user
- **Toggle Interface** - Click plugin buttons to open/close modal windows
- **State Persistence** - Plugin preferences saved between sessions
- **Drop-in Development** - Add new plugins without code changes

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

# Start development server (RECOMMENDED - includes cache protection)
npm run dev:safe

# Alternative: Start with PHP support only (if you don't need full protection)
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
| `npm run dev:safe` | **🚀 RECOMMENDED**: Development with automatic cleanup, cache protection and file integrity |
| `npm run dev:php` | Development with automatic cleanup and PHP server for dataset detection |
| `npm run dev` | ⚠️ Basic Vite server (use only for debugging cache system) |
| `npm run build` | Build for production deployment |
| `npm run cleanup:servers` | **🧹 NEW**: Stop all running PHP and Node.js development servers |
| `npm run check:integrity` | Verify critical files haven't been corrupted |
| `npm run test:cache` | **🧪 Testing**: Run 12 cache busting configuration tests |
| `npm run test:runtime` | **🧪 Testing**: Test live cache behavior while server is running |

## 📁 **Project Structure**

```
articy-webpreview/
├── src/
│   ├── components/          # React components
│   │   ├── InteractiveArticyViewer.tsx
│   │   ├── VariablesPanel.tsx
│   │   ├── SearchNodesPanel.tsx
│   │   └── PluginSelector.tsx
│   ├── panels/              # Node type panels
│   │   ├── InstructionPanel.tsx
│   │   ├── QuestionPanel.tsx
│   │   └── EndOfFlowPanel.tsx
│   ├── plugins/             # Plugin system
│   │   ├── types.ts         # Plugin interfaces
│   │   ├── registry.ts      # Plugin registry
│   │   ├── manager.ts       # Plugin lifecycle
│   │   ├── discovery.ts     # Auto-discovery service
│   │   ├── hello-world/     # Example plugin
│   │   └── test-plugin/     # Demo plugin
│   ├── hooks/               # React hooks
│   │   └── usePlugins.ts    # Plugin state management
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

## � **Plugin System**

The Articy Web Viewer includes a powerful plugin system that allows you to extend functionality with custom features. Plugins are automatically discovered and can be enabled/disabled by users.

### **Using Plugins**

1. **Loading Screen**: When you start the app, expand the "Configure Plugins" section
2. **Select Plugins**: Check the plugins you want to enable for this session
3. **Load Dataset**: Proceed to load your Articy project
4. **Access Plugins**: Enabled plugins appear as buttons in the left sidebar
5. **Toggle Windows**: Click plugin buttons to open/close their modal windows

### **Available Plugins**

- **Hello World Plugin** - Demonstrates basic plugin functionality with project info display
- **Test Plugin** - Shows auto-discovery features and plugin development capabilities

### **Plugin Features**

- **🔍 Auto-Discovery**: Plugins are automatically detected from the `src/plugins/` folder
- **👤 User Control**: Users choose which plugins to enable on the loading screen
- **💾 State Persistence**: Plugin preferences are saved between browser sessions
- **🎛️ Toggle Interface**: Plugin buttons in sidebar toggle modal windows open/closed
- **🎨 Visual Feedback**: Active plugin buttons show blue background when modal is open
- **📱 Responsive Design**: Plugin modals work on both desktop and mobile devices

### **For Plugin Developers**

#### **Creating a New Plugin**

1. **Create Plugin Folder**: `src/plugins/my-plugin/`
2. **Implement Plugin Class**:
   ```typescript
   // src/plugins/my-plugin/MyPlugin.tsx
   import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';

   export class MyPlugin implements IPlugin {
     metadata: PluginMetadata = {
       id: 'my-plugin',
       name: 'My Plugin',
       description: 'Description of what my plugin does',
       version: '1.0.0',
       author: 'Your Name',
       enabled: false
     };

     async initialize(context: PluginContext): Promise<void> {
       // Plugin initialization code
     }

     async destroy(): Promise<void> {
       // Cleanup code
     }

     getButtonConfig(): PluginButtonConfig {
       return {
         text: 'My Plugin',
         icon: <YourIcon />,
         position: 1
       };
     }

     renderModal(props: PluginModalProps): React.ReactNode {
       return (
         <Modal title="My Plugin" open={props.isVisible} onCancel={props.onClose}>
           {/* Your plugin UI here */}
         </Modal>
       );
     }
   }

   export const myPlugin = new MyPlugin();
   ```

3. **Create Entry Point**:
   ```typescript
   // src/plugins/my-plugin/index.ts
   export { myPlugin as default } from './MyPlugin';
   ```

4. **Refresh Browser**: Your plugin will be automatically discovered and available for selection!

#### **Plugin Interface (IPlugin)**

All plugins must implement the `IPlugin` interface:

- **`metadata`**: Plugin information (id, name, description, version, author)
- **`initialize(context)`**: Called when plugin is enabled
- **`destroy()`**: Called when plugin is disabled
- **`getButtonConfig()`**: Returns button configuration for sidebar
- **`renderModal(props)`**: Returns React component for plugin modal
- **`onDatasetLoad(data)`** *(optional)*: Called when dataset loads
- **`onNodeChange(node)`** *(optional)*: Called when current node changes
- **`onVariableChange(variables)`** *(optional)*: Called when variables update

#### **Plugin Context API**

Plugins receive a context object with access to:

- **`project`**: Current Articy project data
- **`currentNode`**: Currently active node
- **`variables`**: Project variables
- **`showMessage(content, type)`**: Display notifications to user
- **`navigateToNode(nodeId)`**: Navigate to specific node
- **`emitEvent(name, data)`**: Send events to other plugins
- **`onEvent(name, handler)`**: Listen for events from other plugins

#### **Development Workflow**

1. **No Registration Required**: Plugins are automatically discovered
2. **Hot Reloading**: Changes to plugin code update immediately during development
3. **Error Handling**: Invalid plugins are gracefully handled with console warnings
4. **TypeScript Support**: Full type checking and IntelliSense support

## �🔄 **Dual Deployment Architecture**

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

# 3. Start development (ALWAYS use safe mode)
npm run dev:safe

# 4. Test runtime behavior (in another terminal)
npm run test:runtime
```

> **💡 Important**: Always use `npm run dev:safe` for development. The basic `npm run dev` command should only be used when debugging the cache system itself.

### **⚠️ Important Development Guidelines**

#### **Git & Repository Management**
- **🚨 ALWAYS ASK BEFORE PUSHING**: Never push to local git or remote repository without explicit permission from the project maintainer
- **Branch Safety**: Currently working on `v4.x` branch - ensure you're on the correct branch before making changes
- **Commit Frequently**: Make small, frequent commits during development to prevent work loss

#### **Server Process Management**
- **🔄 Automatic Cleanup**: Development scripts now automatically kill existing PHP and Node.js processes before starting new ones
- **🧹 Manual Cleanup**: Use `npm run cleanup:servers` to manually stop all development servers
- **⚡ Streamlined Startup**: Git status check removed for faster, uninterrupted development workflow
- **🛡️ Error Resilient**: Scripts continue even if cleanup encounters issues

**Available Cleanup Commands:**
```bash
# Automatic cleanup (built into startup scripts)
npm run dev:safe          # Includes automatic cleanup + full protection
npm run dev:php           # Includes automatic cleanup + PHP support

# Manual cleanup
npm run cleanup:servers   # Stop all PHP and Node.js processes
powershell -ExecutionPolicy Bypass -File cleanup-servers.ps1  # Direct execution
```

**Script Modifications (2025-08-23):**
- ✅ **Added automatic server cleanup** to `start-dev-safe.ps1` and `start-dev-with-php.ps1`
- ✅ **Removed git status check** from startup process for uninterrupted workflow
- ✅ **Created standalone cleanup script** (`cleanup-servers.ps1`) for manual use
- ✅ **Added error handling** with try-catch blocks for robust operation
- ✅ **Improved user feedback** showing number of processes stopped

#### **Log Files & Debugging**
- **Log Location**: Development and debugging logs are stored in the `logs/` folder
- **Console Exports**: Browser console exports saved as `logs/console-export-YYYY-MM-DD_HH-MM-SS.txt`
- **Investigation Logs**: Specific debugging logs like `fallback-detection-debug.log`, `work-loss-investigation.log`
- **Log Cleanup**: Excessive logs are automatically cleaned during project maintenance

#### **File Integrity Protection**
- **🚀 Default Mode**: Always use `npm run dev:safe` for all development work
- **⚠️ Basic Mode**: Only use `npm run dev` when debugging the cache system itself
- **Check Integrity**: Run `npm run check:integrity` before starting development sessions
- **Backup System**: Critical files have `.backup` versions that are automatically restored if corruption is detected

#### **Cache Busting Verification**
- **Test Configuration**: Run `npm run test:cache` to verify all cache prevention features
- **Test Runtime**: Run `npm run test:runtime` while server is running to check live behavior
- **Monitor Performance**: Tests verify minimal cache accumulation and fast file detection

## 🧪 **Cache Busting & Testing**

This project includes comprehensive cache prevention and testing systems to ensure reliable development without file reversion issues.

### **🚀 Why Safe Mode is Superior**

Safe mode (`npm run dev:safe`) provides **better development experience** than basic mode with **zero meaningful downsides**:

| Feature | Safe Mode | Basic Mode |
|---------|-----------|------------|
| **File Protection** | ✅ Complete protection from reversions | ❌ Vulnerable to file corruption |
| **Development Speed** | ✅ No interruptions from lost work | ❌ Time lost to file issues |
| **Hot Reload** | ✅ Reliable with polling-based detection | ⚠️ Event-based (less reliable) |
| **PHP Integration** | ✅ Automatic server management | ❌ Manual setup required |
| **Error Handling** | ✅ Better diagnostics and recovery | ❌ Basic error reporting |
| **Performance** | ✅ Negligible impact (sub-2s file detection) | ✅ Slightly faster (not noticeable) |

**Recommendation**: Use safe mode for **all development work**. Only use basic mode when debugging the cache system itself.

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

1. **Start Server**: `npm run dev:safe` (always use safe mode)
2. **Open Browser**: http://localhost:3000/
3. **Open Dev Tools**: F12 → Network tab
4. **Edit Source File**: Make changes and save
5. **Verify Hot Reload**: Page updates automatically
6. **Check Network Tab**: Look for cache-busting parameters (`?v=timestamp`)

> **💡 Note**: Safe mode provides superior development experience with zero downsides compared to basic mode.

## ⚠️ **Known Issues & Solutions**

### **File Reversion Problem**
This project previously experienced file reversion issues during development. **The safe mode completely prevents these issues.**

```bash
# ALWAYS use safe mode for development (prevents file reversions)
npm run dev:safe

# Check file integrity if you suspect issues
npm run check:integrity

# Test cache system health
npm run test:cache
```

> **✅ Solution**: Safe mode eliminates file reversion problems entirely. There's no reason to use basic mode unless debugging the cache system.

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
