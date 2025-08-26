# Articy Web Viewer v4.x

A modern React-based web viewer for Articy Draft projects that allows anyone with a web browser to preview and interact with your narrative flows without needing Articy installed.

🌐 **Live Demo**: https://dev.chadbriggs.com/articy/v4/

📚 **For Developers**: See [Developer Documentation](devdoc.md) for comprehensive development guides, best practices, and technical specifications.

## ✨ **Key Features**

### **📖 Story Navigation**
- **Dual Format Support** - Works with both Articy Draft 3.x and 4.x projects
- **Interactive Choices** - Click through story branches and decision points
- **Navigation History** - Back button support with full state restoration
- **Story Mode** - Clean reading experience with optional technical elements hidden

### **🔌 Plugin System** ✅
- **Extensible Architecture** - Add custom functionality without modifying core code
- **Dynamic Loading** - Plugins load at runtime from external files in production
- **Murderboard Plugin** - Interactive evidence board with variable-based visibility
- **Evidence System** - Clickable evidence with popup dialogues and dynamic content
- **Hot Reloading** - Plugins update instantly during development
- **Post-Build Customization** - Add/remove plugins without rebuilding the application

### **⚙️ Advanced Features**
- **Variable System** - Real-time variable tracking with search, editing, and bulk import
- **Dataset Management** - Automatic detection and loading with version tracking
- **Simple Console Logging** - One-click console log capture and save for debugging
- **Keyboard Navigation** - Full keyboard support with arrow keys and shortcuts

### **🎯 User Experience**
- **Drag & Drop Loading** - Simple file loading with automatic format detection
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Accessibility** - Full keyboard navigation and screen reader support
- **Performance Optimized** - Fast loading and smooth navigation

### **🖥️ Desktop Version**
- **Zero Installation** - Portable desktop app, no admin rights required
- **Offline Capable** - Works completely offline with local datasets
- **Same Features** - Identical functionality to web version
- **Small Package** - ~35MB total vs 100-200MB for Electron alternatives
- **Easy Dataset Setup** - Copy your Articy JSON folders directly to the app directory

## 🆕 **Latest Updates (August 2025)**

### **🔧 Clean Dataset Separation**
- **Development Isolation** - Development datasets separated from production builds
- **Clean Deployments** - Web builds no longer include development test data
- **Seamless Development** - Full dataset functionality during development without contamination
- **Identical Functionality** - All deployment types (web, desktop, development) work identically

### **🔧 Simplified Console Logging**
- **Automatic Capture** - Console logs captured in memory from app startup
- **One-Click Save** - Floating button to save all logs to server instantly
- **Batch Processing** - Efficient single-request log saving with automatic cleanup
- **User-Controlled** - Save logs only when needed for debugging

### **🛡️ Enhanced Development Tools**
- **File Protection System** - Prevents file corruption during development
- **Automatic Cleanup** - Development scripts manage server processes automatically
- **Integrity Checking** - Automated verification of critical files
- **Safe Mode** - Comprehensive cache prevention for stable development

## 🚀 **Quick Start**

### **🌐 Web Version (Online)**
1. Visit https://dev.chadbriggs.com/articy/v4/
2. Drag and drop your Articy JSON files or select from available datasets
3. Start exploring your interactive story!

### **🖥️ Desktop Version (Offline)**
1. Download the latest desktop release from [GitHub Releases](https://github.com/chad-ld/articy-webpreview/releases)
2. Extract the ZIP file to any location (Desktop, Documents, USB drive)
3. **Add your datasets**: Copy your Articy JSON folders to the `app` directory
   - Example: Copy `myproject.json` folder to `app/myproject.json`
4. Double-click `start-articy.bat` to launch
5. Your browser opens automatically - no installation required!

### **For Developers**
```bash
# Clone the repository
git clone https://github.com/chad-ld/articy-webpreview.git
cd articy-webpreview

# Install dependencies
npm install

# Start development server (RECOMMENDED)
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1

# Alternative: Use npm command
npm run dev:safe
```

## 📁 **Project Structure**

```
articy-webpreview/
├── src/
│   ├── components/          # React components
│   ├── services/            # API and data services
│   ├── plugins/            # Plugin system
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── public/
│   ├── *.php              # Server endpoints
│   └── assets/            # Static assets
├── datasets-dev/          # 🆕 Development datasets (isolated from builds)
│   ├── mpos1.5.json/      # Sample dataset folder
│   ├── demo4.json/        # Sample dataset folder
│   └── ...                # Other development datasets
├── devdoc.md              # Developer documentation
└── devdoc_*.md            # Feature-specific docs
```

## 🔧 **Development**

### **🚀 Starting Development Server**

**IMPORTANT**: Always use the safe development script, not `npm run dev` directly.

```powershell
powershell -ExecutionPolicy Bypass -File start-dev-safe.ps1
```

This script provides:
- ✅ **Dual Server Setup** - PHP server (port 8080) + Vite server (port 3000)
- ✅ **Dataset Separation** - Development datasets isolated from production builds
- ✅ **Cache Protection** - Prevents file reversion issues during development
- ✅ **Process Cleanup** - Ensures clean startup without port conflicts

### **Essential Commands**
| Command | Description |
|---------|-------------|
| `start-dev-safe.ps1` | **🚀 REQUIRED**: Development with dataset separation and protection |
| `npm run check:integrity` | Verify critical files haven't been corrupted |
| `npm run test:cache` | Test cache busting configuration |
| `npm run build` | Build for production deployment |
| `npm run build:desktop` | Create portable desktop package in builds/ folder |

### **Plugin Development**
1. Create a new folder in `src/plugins/`
2. Implement the plugin interface
3. Add your plugin to the loading screen
4. Test with hot reloading

See [Plugin Documentation](devdoc_plugins.md) for detailed plugin development guide.

## 📚 **Documentation**

### **For Developers**
- **[Developer Guide](devdoc.md)** - Main developer documentation with best practices
- **[Desktop Version](devdoc_desktop-version.md)** - Portable desktop implementation guide
- **[Logging System](devdoc_logging.md)** - Real-time session-based console logging
- **[Plugin Architecture](devdoc_plugins.md)** - Plugin development and integration
- **[File Protection](devdoc_fileprotection.md)** - Development stability and backup systems

### **Legacy Documentation**
- **[Dual Deployment Plan](dual-deployment-plan.md)** - Original Electron-based desktop plan (superseded)
- **[File Protection System](FILE-PROTECTION-README.md)** - Development stability guide

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Run `npm run check:integrity` before starting
4. Make your changes
5. Test with both 3.x and 4.x datasets
6. Submit a pull request

## 🎯 **Use Cases**

### **Game Developers**
- Preview narrative flows before implementation
- Test story branches and variable logic
- Share interactive prototypes with team members

### **Writers & Narrative Designers**
- Review story structure and pacing
- Test dialogue flows and character interactions
- Collaborate with non-technical team members

### **QA & Testing**
- Verify story logic and variable states
- Test edge cases and error conditions
- Document bugs with detailed session logs

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Built with React, TypeScript, and Vite
- UI components from Ant Design
- Supports Articy Draft 3.x and 4.x formats
- Plugin system inspired by modern extensible architectures

---

> **💡 Tip**: For the best development experience, always use the safe development mode and check file integrity regularly. See the [Developer Documentation](devdoc.md) for comprehensive guides and best practices.
