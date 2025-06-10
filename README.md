# Articy Web Viewer

A web-based viewer for Articy Draft JSON exports that allows interactive navigation through narrative flows without requiring Articy Draft installation.

## Features

- 🎮 **Interactive Navigation**: Click through narrative flows with "Next" buttons and choice selections
- 🔀 **Multi-Path Support**: Automatically detects and displays multiple branching options
- 🎨 **Visual Fidelity**: Maintains original Articy node colors and formatting
- 📱 **Drag & Drop**: Load JSON files directly in browser - no web server required
- 🔧 **Variable System**: Full support for Articy variables and conditional logic
- 🎯 **Template Support**: Comprehensive coverage of all major Articy node types

## Quick Start

### Local Usage (No Web Server)
1. Open `index.html` in your browser
2. Drag and drop your Articy JSON export file
3. Navigate through your narrative!

### Web Deployment
1. Build the project: `npm run build`
2. Deploy using included scripts:
   - **SFTP**: `deploy-to-sftp-winscp.bat`
   - **FTP**: `deploy-to-ftp.bat`
3. Share the URL with your team

## Supported Node Types

- **Instruction Nodes**: Text display with navigation
- **Hub Nodes**: Choice/branching points
- **Location Nodes**: Scene/location descriptions
- **Template Nodes**: NPCs, items, dialogue, etc.
- **Flow Nodes**: Automatic navigation containers
- **Condition Nodes**: Variable-based branching
- **Jump Nodes**: Direct navigation

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Documentation

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)**: Comprehensive technical documentation
- **[LOCAL_USAGE_README.md](LOCAL_USAGE_README.md)**: Local usage instructions

## Recent Updates

- ✅ Multi-path navigation with proper choice formatting
- ✅ Comprehensive template node support
- ✅ Enhanced drag & drop file loading
- ✅ Automated deployment scripts
- ✅ Improved syntax highlighting

## License

This project is designed for use with Articy Draft exports and narrative development workflows.
