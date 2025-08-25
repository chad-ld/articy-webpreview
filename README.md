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

### **🔌 Plugin System**
- **Extensible Architecture** - Add custom functionality without modifying core code
- **Murderboard Plugin** - Interactive evidence board with variable-based visibility
- **Evidence System** - Clickable evidence with popup dialogues and dynamic content
- **Hot Reloading** - Plugins update instantly during development

### **⚙️ Advanced Features**
- **Variable System** - Real-time variable tracking with search, editing, and bulk import
- **Dataset Management** - Automatic detection and loading with version tracking
- **Real-Time Logging** - Session-based console logging for debugging
- **Keyboard Navigation** - Full keyboard support with arrow keys and shortcuts

### **🎯 User Experience**
- **Drag & Drop Loading** - Simple file loading with automatic format detection
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Accessibility** - Full keyboard navigation and screen reader support
- **Performance Optimized** - Fast loading and smooth navigation

## 🆕 **Latest Updates (August 2025)**

### **🔧 Real-Time Session-Based Logging**
- **Persistent Log Files** - Each browser session gets its own continuously growing log file
- **Real-Time Streaming** - Console entries immediately written to server files
- **Session Management** - Automatic session tracking with heartbeat monitoring
- **Administrative Interface** - Monitor active sessions and manage log files

### **🛡️ Enhanced Development Tools**
- **File Protection System** - Prevents file corruption during development
- **Automatic Cleanup** - Development scripts manage server processes automatically
- **Integrity Checking** - Automated verification of critical files
- **Safe Mode** - Comprehensive cache prevention for stable development

## 🚀 **Quick Start**

### **For End Users**
1. Visit https://dev.chadbriggs.com/articy/v4/
2. Drag and drop your Articy JSON files or select from available datasets
3. Start exploring your interactive story!

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
│   ├── plugins/            # Plugin system
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── public/
│   ├── datasets/           # Sample datasets
│   ├── *.php              # Server endpoints
│   └── assets/            # Static assets
├── devdoc.md              # Developer documentation
└── devdoc_*.md            # Feature-specific docs
```

## 🔧 **Development**

### **Essential Commands**
| Command | Description |
|---------|-------------|
| `npm run dev:safe` | **🚀 RECOMMENDED**: Development with full protection |
| `npm run check:integrity` | Verify critical files haven't been corrupted |
| `npm run test:cache` | Test cache busting configuration |
| `npm run build` | Build for production deployment |

### **Plugin Development**
1. Create a new folder in `src/plugins/`
2. Implement the plugin interface
3. Add your plugin to the loading screen
4. Test with hot reloading

See [Plugin Documentation](devdoc_plugins.md) for detailed plugin development guide.

## 📚 **Documentation**

### **For Developers**
- **[Developer Guide](devdoc.md)** - Main developer documentation with best practices
- **[Logging System](devdoc_logging.md)** - Real-time session-based console logging
- **[Plugin Architecture](devdoc_plugins.md)** - Plugin development and integration
- **[File Protection](devdoc_fileprotection.md)** - Development stability and backup systems

### **Legacy Documentation**
- **[Dual Deployment Plan](dual-deployment-plan.md)** - Technical architecture details
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
