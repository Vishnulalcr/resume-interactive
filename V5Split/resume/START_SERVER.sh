#!/bin/bash

# Works Canvas - Local HTTP Server Launcher
# This script starts a local HTTP server so you can view the interactive resume

echo "🚀 Starting Works Canvas HTTP Server..."
echo ""
echo "Starting Python HTTP server on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    cd "$(dirname "$0")"
    python3 -m http.server 8000
else
    # Fallback to python
    cd "$(dirname "$0")"
    python -m SimpleHTTPServer 8000
fi
