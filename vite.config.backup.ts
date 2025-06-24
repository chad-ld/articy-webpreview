import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BACKUP CONFIGURATION - DO NOT MODIFY
// This is a backup of the working dual deployment configuration
// Use this to restore vite.config.ts if it gets reverted

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/articy/v4.1/' : '/', // Only use base path for production builds
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
      // Catch-all for other PHP files
      '*.php': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}))
