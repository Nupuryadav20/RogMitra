@echo off
title RogMitra Dev Launcher
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
echo RogMitra is launching!
echo.
echo 1. Backend API Swagger Docs: http://127.0.0.1:8000/docs
echo 2. Frontend Web Interface:  http://localhost:5173
echo.
echo Press any key to close this launcher window (servers keep running).
echo ========================================================
pause >nul
