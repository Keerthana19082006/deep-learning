@echo off
title EarthGuardian AI Launcher
echo ========================================================
echo        EarthGuardian AI - Multi-Hazard Risk System
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Identify Python Virtual Environment
set "PYTHON_EXE="
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else if exist "backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

:: 2. Check Python availability
"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found! Please ensure Python or .venv is properly installed.
    pause
    exit /b 1
)

:: 3. Check npm availability
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found! Please install Node.js (v18+) to run the frontend.
    pause
    exit /b 1
)

echo [1/3] Python interpreter verified: %PYTHON_EXE%
echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "EarthGuardian Backend" cmd /k "cd /d "%~dp0" && "%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo [3/3] Launching Vite Frontend on http://localhost:5173 ...
start "EarthGuardian Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  All services launched successfully!
echo  Backend:  http://127.0.0.1:8000 (API Docs: /docs)
echo  Frontend: http://localhost:5173
echo ========================================================
echo.
echo Waiting 3 seconds before opening browser...
timeout /t 3 >nul
start http://localhost:5173
