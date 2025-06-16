# Articy Web Viewer - Local Usage Guide

## The CORS Issue

When trying to open the HTML file directly in a browser (`file://` protocol), you may encounter this error:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

This happens because modern browsers block ES modules and local file access for security reasons.

## Solution: Simple Local Server

We've included a simple local server that solves this issue. Here are your options:

### Option 1: Use the Included Local Server (Recommended)

**Requirements:** Node.js installed on your system

#### Windows Users:
1. Double-click `start-server.bat`
2. The server will start automatically
3. Open your browser to `http://localhost:3000`

#### Mac/Linux Users:
1. Open terminal in this directory
2. Run: `./start-server.sh`
3. Open your browser to `http://localhost:3000`

#### Manual Start:
```bash
node local-server.cjs
```

### Option 2: Use Python (if you have Python installed)

#### Python 3:
```bash
python -m http.server 3000
```

#### Python 2:
```bash
python -m SimpleHTTPServer 3000
```

Then open `http://localhost:3000`

### Option 3: Use Node.js serve package

```bash
# Install globally
npm install -g serve

# Run in this directory
serve -s . -p 3000
```

### Option 4: Use any other local server

Any static file server will work. Just serve this directory and open the URL in your browser.

## Features

✅ **Drag & Drop Support** - Drop your Articy JSON files directly onto the interface  
✅ **No Web Server Required** - Runs completely locally  
✅ **Offline Capable** - Works without internet connection  
✅ **Cross-Platform** - Works on Windows, Mac, and Linux  

## Usage Instructions

1. **Start the local server** using one of the methods above
2. **Open your browser** to `http://localhost:3000`
3. **Drag & drop** your Articy JSON export file onto the interface
4. **Navigate** through your interactive story!

## Troubleshooting

### "Node.js not found" error
- Install Node.js from: https://nodejs.org/
- Make sure it's added to your system PATH

### Port 3000 already in use
- The server will show an error if port 3000 is busy
- Edit `local-server.cjs` and change the `PORT` variable to a different number (e.g., 3001, 8000, etc.)

### File not loading
- Make sure your JSON file is a valid Articy export
- Check the browser console (F12) for error messages
- Ensure the JSON file contains the `//HTMLPREVIEW` start node

## Alternative: Web Server Deployment

If you prefer to deploy to a web server, simply:
1. Upload this entire directory to your web server
2. Place your Articy JSON file in the same directory
3. The app will automatically load it (no drag & drop needed)

## Need Help?

- Check the browser console (F12) for error messages
- Ensure your Articy export includes a node with `//HTMLPREVIEW` in the expression
- Verify the JSON file is valid and not corrupted
