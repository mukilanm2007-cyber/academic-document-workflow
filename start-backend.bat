@echo off
title Backend API Server (Port 5000)
echo [2/3] Starting Backend API Server...
cd /d "%~dp0backend"
"C:\Program Files\nodejs\node.exe" src/server.js
