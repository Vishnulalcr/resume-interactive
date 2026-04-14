@echo off
REM Works Canvas - Local HTTP Server Launcher for Windows
REM This script starts a local HTTP server so you can view the interactive resume

echo.
echo 🚀 Starting Works Canvas HTTP Server...
echo.
echo Starting Python HTTP server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Try Python 3 first
python --version >nul 2>&1
if errorlevel 1 goto :python_not_found

python -m http.server 8000
goto :end

:python_not_found
echo Error: Python is not installed or not in PATH
echo.
echo Please install Python from https://www.python.org/downloads/
echo Make sure to check "Add python.exe to PATH" during installation
pause
:end

