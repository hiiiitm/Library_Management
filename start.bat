@echo off
title Library Management System Launcher
echo =====================================================================
echo       Starting Library Management System (FastAPI + React)
echo =====================================================================
echo.

:: Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
    )
)

:: Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    echo [1/3] Activating Python virtual environment...
    call .venv\Scripts\activate.bat
    set PYTHON_CMD=.venv\Scripts\python
) else (
    echo [1/3] Using system Python...
    set PYTHON_CMD=python
)

echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "LMS Backend (FastAPI)" cmd /k "%PYTHON_CMD% -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Launching React Vite Frontend on http://127.0.0.1:5173 ...
start "LMS Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo SUCCESS: Both servers are launching in separate windows!
echo - Backend API:  http://127.0.0.1:8000/docs
echo - Frontend App: http://127.0.0.1:5173
echo =====================================================================
echo You can open your browser at: http://127.0.0.1:5173
echo.
pause
