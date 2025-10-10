import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
// Custom plugin to serve dataset files
const datasetFilePlugin = () => ({
  name: 'dataset-file-server',
  configureServer(server) {
    console.log('🔧 Registering dataset file middleware...');
    // Add middleware to serve dataset files from datasets-dev
    server.middlewares.use((req, res, next) => {
      // Debug: Log all requests to see what's being requested
      if (req.url?.includes('datasets-dev') || req.url?.includes('.json')) {
        console.log(`🔍 Middleware checking request: ${req.url}`);
      }

      // Check if this is a dataset file request (pattern: /datasets-dev/datasetname.json/filename.json with optional query params)
      const match = req.url?.match(/^\/datasets-dev\/([^\/]+\.json)\/([^\/]+\.json)(\?.*)?$/);
      if (match) {
        const [, datasetFolder, fileName] = match;
        const filePath = resolve(__dirname, 'datasets-dev', datasetFolder, fileName);

        console.log(`🔄 Serving dataset file: ${req.url} -> ${filePath}`);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(content);
          return;
        } else {
          console.log(`❌ Dataset file not found: ${filePath}`);
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
      }
      next();
    });
  }
});

// Custom plugin to copy config.json and .htaccess to dist during build
const copyConfigPlugin = () => ({
  name: 'copy-config',
  writeBundle() {
    // Copy config.json from datasets-dev to dist during build
    const configSource = resolve(__dirname, 'datasets-dev', 'config.json');
    const configDest = resolve(__dirname, 'dist', 'config.json');

    if (fs.existsSync(configSource)) {
      try {
        fs.copyFileSync(configSource, configDest);
        console.log('📋 Copied config.json to dist folder');
      } catch (error) {
        console.error('❌ Failed to copy config.json:', error);
      }
    } else {
      console.warn('⚠️ config.json not found in datasets-dev folder');
    }

    // Copy .htaccess file to dist during build (for web server deployment)
    const htaccessSource = resolve(__dirname, 'dist', '.htaccess');
    if (fs.existsSync(htaccessSource)) {
      console.log('📋 .htaccess file already exists in dist folder');
    } else {
      // Create .htaccess if it doesn't exist
      const htaccessContent = `# Articy Web Viewer - Apache Configuration
# Handles routing for Single Page Application while preserving direct file access

RewriteEngine On

# Security: Prevent access to sensitive files
<Files "*.backup">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>

# Enable CORS for all origins (adjust as needed for production)
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# CRITICAL: Allow direct access to PHP files (datasets.php, save-log.php, etc.)
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \\.php$
RewriteRule ^(.*)$ $1 [L]

# CRITICAL: Allow direct access to JSON files in dataset folders
# Pattern: /datasets/datasetname.json/filename.json
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \\.json$
RewriteRule ^(.*)$ $1 [L]

# CRITICAL: Allow direct access to config.json
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} ^/config\\.json$
RewriteRule ^(.*)$ $1 [L]

# Allow direct access to static assets (CSS, JS, images, etc.)
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$
RewriteRule ^(.*)$ $1 [L]

# Allow direct access to plugin files
RewriteCond %{REQUEST_FILENAME} -f
RewriteCond %{REQUEST_URI} ^/.*plugins/
RewriteRule ^(.*)$ $1 [L]

# Allow direct access to dataset files AND directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_URI} ^/.*datasets/
RewriteRule ^(.*)$ $1 [L]

# SPA Fallback: Route everything else to index.html for React Router
# This must be LAST to avoid interfering with direct file access
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]`;

      try {
        fs.writeFileSync(htaccessSource, htaccessContent);
        console.log('📋 Created .htaccess file in dist folder');
      } catch (error) {
        console.error('❌ Failed to create .htaccess file:', error);
      }
    }

    // Create empty datasets folder for web server deployment
    const datasetsDir = resolve(__dirname, 'dist', 'datasets');
    if (!fs.existsSync(datasetsDir)) {
      try {
        fs.mkdirSync(datasetsDir, { recursive: true });

        // Create a README file in the datasets folder
        const readmeContent = `# Datasets Folder

This folder is for your Articy Draft JSON dataset files.

## How to add datasets:

### For 4.x format (Articy Draft X):
1. Export your project from Articy Draft X as JSON
2. Copy the entire exported folder (e.g., "myproject.json") into this datasets folder
3. The folder should contain files like:
   - manifest.json
   - global_variables.json
   - hierarchy.json
   - object_definitions.json
   - package_*.json files

### For 3.x format (Articy Draft 3):
1. Export your project from Articy Draft 3 as JSON
2. Copy the exported JSON file (e.g., "myproject.json") directly into this datasets folder

## Example structure:
\`\`\`
datasets/
├── myproject.json/          # 4.x format (folder)
│   ├── manifest.json
│   ├── global_variables.json
│   └── ...
└── oldproject.json          # 3.x format (single file)
\`\`\`

The application will automatically detect and list all datasets in this folder.
`;

        fs.writeFileSync(resolve(datasetsDir, 'README.md'), readmeContent);
        console.log('📁 Created empty datasets folder with README');
      } catch (error) {
        console.error('❌ Failed to create datasets folder:', error);
      }
    } else {
      console.log('📁 Datasets folder already exists in dist');
    }

    // Remove nppBackup folder if it was copied from public/
    const nppBackupDir = resolve(__dirname, 'dist', 'nppBackup');
    if (fs.existsSync(nppBackupDir)) {
      try {
        fs.rmSync(nppBackupDir, { recursive: true, force: true });
        console.log('🗑️ Removed nppBackup folder from dist');
      } catch (error) {
        console.error('❌ Failed to remove nppBackup folder:', error);
      }
    }
  }
});

export default defineConfig(({ command }) => ({
  plugins: [react(), datasetFilePlugin(), copyConfigPlugin()],
  base: command === 'build' ? './' : '/', // Use relative paths for builds, root path for dev
  // Disable caching to prevent file reversion issues
  cacheDir: false,
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false  // Disable error overlay that can cause cache issues
    },
    watch: {
      usePolling: true,  // More reliable file watching
      interval: 100      // Check for changes every 100ms
    },
    proxy: {
      // Proxy PHP requests to a PHP server running on port 8080
      '/datasets.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Log proxy requests for debugging
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`🔄 Proxying PHP request: ${req.url} -> http://localhost:8080${req.url}`);
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ PHP proxy error:', err.message);
          });
        }
      },
      // Proxy save-log.php specifically
      '/save-log.php': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Log proxy requests for debugging
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`🔄 Proxying save-log.php request: ${req.url} -> http://localhost:8080${req.url}`);
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ save-log.php proxy error:', err.message);
          });
        }
      },
      // DISABLED - Real-time logging endpoints (legacy)
      // '/append-log.php': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true
      // },
      // '/cleanup-sessions.php': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true
      // },
      // Catch-all for other PHP files
      '*.php': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Exclude plugin files from main bundle in production builds
      external: command === 'build' ? (id) => {
        // Exclude plugin modules from main bundle, but include core plugin system files
        return id.includes('/src/plugins/') &&
               !id.includes('/src/plugins/types.ts') &&
               !id.includes('/src/plugins/registry.ts') &&
               !id.includes('/src/plugins/manager.ts') &&
               !id.includes('/src/plugins/discovery.ts') &&
               !id.includes('/src/plugins/index.ts') &&
               !id.includes('/src/plugins/isolatedRenderManager.ts');
      } : undefined
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}))
