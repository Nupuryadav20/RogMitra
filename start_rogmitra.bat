@echo off
title RogMitra One-Click Launcher
echo ========================================================
echo          RogMitra - AI Patient Case-Taking Software
echo ========================================================
echo.
echo Starting Backend (FastAPI on Port 8000)...
start "RogMitra Backend (FastAPI)" cmd /k "cd /d %~dp0backend && ..\backend\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

echo Starting Frontend (Vite React on Port 5173)...
start "RogMitra Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo RogMitra is starting up!
echo.
echo 1. Frontend Web App:     http://localhost:5173
echo 2. Backend Swagger Docs: http://127.0.0.1:8000/docs
echo.
echo Press any key to close this window (servers keep running).
echo ========================================================
pause >nul
