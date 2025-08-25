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
      if (req.url?.includes('.json')) {
        console.log(`🔍 Middleware checking JSON request: ${req.url}`);
      }

      // Check if this is a dataset file request (pattern: /datasetname.json/filename.json with optional query params)
      const match = req.url?.match(/^\/([^\/]+\.json)\/([^\/]+\.json)(\?.*)?$/);
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

// Custom plugin to copy config.json to dist during build
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
        // Exclude plugin modules from main bundle
        return id.includes('/src/plugins/') && !id.includes('/src/plugins/types.ts') && !id.includes('/src/plugins/registry.ts') && !id.includes('/src/plugins/manager.ts') && !id.includes('/src/plugins/discovery.ts') && !id.includes('/src/plugins/index.ts');
      } : undefined
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}))
