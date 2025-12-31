@echo off
cd /d "%~dp0"

echo ===================================================
echo   AI Medical Assistant - Backend Launcher
echo ===================================================

IF NOT EXIST "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found in venv\Scripts!
    echo Please ensure the venv was created correctly.
    pause
    exit /b 1
)

echo [1/2] Installing dependencies using venv Python...
.\venv\Scripts\python.exe -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Installation failed. Please check the error above.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Starting Backend Server...
echo Server running at: http://localhost:8000
echo.
.\venv\Scripts\python.exe -m app.main
pause
