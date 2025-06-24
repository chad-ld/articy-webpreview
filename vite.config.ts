import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/articy/v4.1/' : '/', // Only use base path for production builds
  server: {
    port: 3000,
    open: true,
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
      // Catch-all for any other PHP files
      '**/*.php': {
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
