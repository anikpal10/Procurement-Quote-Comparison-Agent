@echo off
title ProcureAI Server Launcher
echo ============================================================
echo   PROCURAI - STARTING LOCAL BACKEND AND FRONTEND SERVERS
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on Port 8001...
start "ProcureAI Backend (Port 8001)" cmd /k "set PYTHONPATH=services\api && python -m uvicorn app.main:app --app-dir services/api --host 0.0.0.0 --port 8001"

echo [2/2] Launching Next.js Frontend on Port 3000...
start "ProcureAI Frontend (Port 3000)" cmd /k "cd apps\web && npm run dev"

echo.
echo ============================================================
echo   ALL SERVERS LAUNCHED!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8001
echo ============================================================
echo.
pause
