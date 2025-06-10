#!/bin/bash

echo ""
echo "========================================"
echo "  Articy Web Viewer - Local Server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Then try running this script again."
    echo ""
    exit 1
fi

echo "✅ Node.js found"
echo "🚀 Starting Articy Web Viewer server..."
echo ""

# Start the server
node local-server.cjs
