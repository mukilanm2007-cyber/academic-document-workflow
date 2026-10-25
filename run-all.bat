@echo off
echo ============================================================
echo   Starting Digital Academic Document Workflow System
echo ============================================================
echo.

start "1. MySQL Server" cmd /k "%~dp0start-db.bat"
timeout /t 3 /nobreak >nul

start "2. Backend API" cmd /k "%~dp0start-backend.bat"
timeout /t 2 /nobreak >nul

start "3. Frontend UI" cmd /k "%~dp0start-frontend.bat"
timeout /t 3 /nobreak >nul

echo.
echo [DONE] All services launched!
echo Opening web application at http://localhost:5173 ...
start http://localhost:5173
