#!/usr/bin/env node

/**
 * Simple local server for Articy Web Viewer
 * This allows the app to run locally without CORS issues
 * 
 * Usage:
 * 1. Place this file in the same directory as index.html
 * 2. Run: node local-server.js
 * 3. Open browser to http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // Parse the URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root requests
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Construct file path
  const filePath = path.join(__dirname, pathname);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
        return;
      }
      
      // Set appropriate headers
      const mimeType = getMimeType(filePath);
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('🚀 Articy Web Viewer Server Started!');
  console.log(`📂 Serving files from: ${__dirname}`);
  console.log(`🌐 Open your browser to: http://localhost:${PORT}`);
  console.log('📋 To stop the server, press Ctrl+C');
  console.log('');
  console.log('💡 Tip: Place your Articy JSON files in this directory and they will be accessible!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
