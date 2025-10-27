/**
 * Web Package Creator
 * Creates a packaged web version of the Articy Web Viewer in the builds folder
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebPackageCreator {
  constructor() {
    // Generate the package name using the same convention as desktop
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const version = packageJson.version;
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const packageName = `articy-webviewer-v${version}-${timestamp}`;

    this.packageDir = path.join('builds', packageName);
    this.distDir = 'dist';
  }

  async createWebPackage() {
    console.log('🏗️ Creating web package...');

    try {
      // 1. Verify dist folder exists
      if (!fs.existsSync(this.distDir)) {
        throw new Error('dist folder not found. Run npm run build first.');
      }

      // 2. Create package directory
      console.log('📁 Setting up package directory...');
      await this.setupPackageDirectory();

      // 3. Copy dist contents
      console.log('📁 Copying web application...');
      await this.copyWebApplication();

      // 4. Create documentation
      console.log('📚 Creating user documentation...');
      await this.createDocumentation();

      console.log('✅ Web package created successfully!');
      console.log(`📁 Package location: ${path.resolve(this.packageDir)}`);
      console.log('');
      console.log('📦 Package contents:');
      console.log('  - index.html (main application)');
      console.log('  - config.json (configuration)');
      console.log('  - .htaccess (Apache configuration)');
      console.log('  - assets/ (compiled JavaScript and CSS)');
      console.log('  - plugins/ (plugin files)');
      console.log('  - datasets/ (empty folder for user datasets)');
      console.log('  - *.php (backend endpoints)');
      console.log('  - README.txt (deployment instructions)');
      console.log('');
      console.log('🎯 Ready for web server deployment!');
      console.log('💡 To create ZIP: Right-click folder → Send to → Compressed folder');

    } catch (error) {
      console.error('❌ Error creating web package:', error.message);
      process.exit(1);
    }
  }

  async setupPackageDirectory() {
    // Create or clean the package directory
    if (fs.existsSync(this.packageDir)) {
      console.log(`  🗑️ Cleaning existing package directory...`);
      await fs.remove(this.packageDir);
    }
    await fs.ensureDir(this.packageDir);
    console.log(`  ✓ Created package directory: ${this.packageDir}`);
  }

  async copyWebApplication() {
    // Copy all contents from dist to package directory
    await fs.copy(this.distDir, this.packageDir, {
      filter: (src) => {
        // Exclude any development files that shouldn't be in production
        const excludePatterns = ['.DS_Store', 'Thumbs.db', 'nppBackup'];
        return !excludePatterns.some(pattern => src.includes(pattern));
      }
    });
    console.log('  ✓ Copied web application from dist/');
  }

  async createDocumentation() {
    // Get version and commit info
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const buildDate = new Date().toISOString().slice(0, 10);

    let commitHash = 'unknown';
    try {
      commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
      console.log('  ⚠️ Could not get git commit hash');
    }

    // Get current branch
    let branch = 'unknown';
    try {
      branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (e) {
      console.log('  ⚠️ Could not get git branch');
    }

    const readmeContent = `Articy Web Viewer - Web Build
==============================
Version: ${version}
Build Date: ${buildDate}
Branch: ${branch}

WHAT'S INCLUDED:
- Complete web application build
- All plugins (mysteryworks-murderboard, hello-world, test-plugin)
- PHP backend for dataset detection and logging
- Configuration file (config.json)
- .htaccess for Apache servers

DEPLOYMENT INSTRUCTIONS:
========================

1. UPLOAD TO WEB SERVER:
   - Upload all files and folders to your web server
   - Ensure PHP 7.4+ is available on the server
   - Ensure the datasets/ folder is writable (for dataset uploads)

2. VERIFY PHP SUPPORT:
   - Test datasets.php is accessible: http://yoursite.com/datasets.php
   - Should return JSON list of available datasets

3. CONFIGURE (.htaccess):
   - The included .htaccess file is configured for Apache
   - For Nginx, you'll need to configure URL rewriting separately
   - Ensure mod_rewrite is enabled on Apache servers

4. ADD YOUR DATASETS:
   - Upload Articy JSON dataset folders to the datasets/ folder
   - Example: Upload "myproject.json" folder to "datasets/myproject.json"
   - OR use the drag-and-drop interface in the web app

TESTING LOCALLY:
================

Option 1 - PHP Built-in Server:
   php -S localhost:8080
   Then visit: http://localhost:8080

Option 2 - Using npm (from project root):
   npm run build:test
   This will build and start a test server

CONFIGURATION:
==============

Edit config.json to customize:
- datasets.autoLoad: Pre-select a dataset (e.g., "mpos1.5")
- datasets.skipLoadingScreen: Skip loading screen (true/false)
- ui.storyMode: Enable story mode by default (true/false)
- ui.variablesPanel: Show variables panel (true/false)
- ui.searchPanel: Show search panel (true/false)
- plugins.defaultEnabled: List of plugins to enable by default

SYSTEM REQUIREMENTS:
====================
Server Requirements:
- PHP 7.4+ (8.x recommended)
- Apache with mod_rewrite OR Nginx
- ~50MB disk space

Browser Requirements:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Cookies enabled (for localStorage)

FILE STRUCTURE:
===============
/
├── index.html              # Main application entry point
├── config.json             # Configuration file
├── .htaccess              # Apache configuration
├── assets/                # CSS, JS, and other assets
├── plugins/               # Plugin files (.js + plugins.json manifest)
├── datasets/              # Dataset folder (user-uploaded content)
│   └── README.md         # Instructions for dataset placement
├── datasets.php           # PHP backend for dataset detection
├── save-log.php           # PHP backend for console log saving
├── append-log.php         # PHP backend for log appending
├── cleanup-sessions.php   # PHP backend for session cleanup
└── README.txt            # This file

FEATURES IN THIS BUILD:
=======================
✅ Dual Format Support (Articy 3.x and 4.x)
✅ Interactive Navigation with History
✅ Plugin System (3 plugins included)
✅ Variable System with Complex Conditions
✅ Story Mode (hide technical nodes)
✅ Search Functionality
✅ Console Logging System
✅ Configuration System
✅ Environment Detection
✅ Language-specific localization support (e.g., "en", "de", etc.)

PLUGINS INCLUDED:
=================
1. mysteryworks-murderboard - Evidence tracking and mystery solving interface
2. hello-world - Example plugin demonstrating plugin API
3. test-plugin - Testing plugin for development

UPDATING PLUGINS:
=================
To add custom plugins:
1. Build your plugin following the plugin development guide
2. Upload the plugin .js file to the plugins/ folder
3. Plugin will be auto-discovered via plugins.json manifest

TROUBLESHOOTING:
================

Issue: Datasets not showing
Solution:
- Check PHP is working: visit /datasets.php directly
- Verify datasets/ folder has correct structure (folder.json/ format)
- Check file permissions on datasets/ folder

Issue: Plugins not loading
Solution:
- Verify plugins/ folder contains plugins.json manifest
- Check browser console for plugin loading errors
- Ensure plugin .js files are in plugins/ folder

Issue: Variables not updating
Solution:
- Check browser console for variable processing logs
- Verify Instruction nodes contain variable assignments
- Ensure Condition nodes only contain condition expressions

Issue: Text showing as keys (e.g., "DFr_439F1F44.Text")
Solution:
- This build includes localization fixes for language-specific keys
- Verify your dataset's localization files are properly formatted
- Check browser console for localization resolution logs

Issue: .htaccess not working
Solution:
- Verify mod_rewrite is enabled on Apache
- Check Apache configuration allows .htaccess overrides
- For Nginx, configure URL rewriting manually

DOCUMENTATION:
==============
For detailed documentation, see the project repository:
https://github.com/chad-ld/articy-webpreview

Developer documentation available in devdocs/ folder:
- devdoc.md - Main documentation
- devdoc_plugins.md - Plugin development guide
- devdoc_variables.md - Variable system documentation
- devdoc_configuration.md - Configuration guide
- And more...

SUPPORT:
========
For issues, questions, or contributions:
GitHub: https://github.com/chad-ld/articy-webpreview
Issues: https://github.com/chad-ld/articy-webpreview/issues

LICENSE:
========
[Add your license information here]

---
Build Information:
- Build Tool: Vite 4.3.8
- Build Date: ${buildDate}
- Commit: ${commitHash}
- Branch: ${branch}
- Localization: Fixed to support language-specific keys (en, de, etc.)
`;

    await fs.writeFile(path.join(this.packageDir, 'README.txt'), readmeContent);
    console.log('  ✓ Created README.txt with deployment instructions');
  }
}

// Run the packager
const creator = new WebPackageCreator();
creator.createWebPackage();
