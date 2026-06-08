@echo off
echo ================================================
echo        AEGIS RADAR - Backend Server
echo ================================================

cd /d E:\aegisradar\backend

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Set environment
set PYTHONPATH=%cd%

echo.
echo 🚀 Starting Aegis Radar Backend...
echo    URL: http://127.0.0.1:8000
echo    Press Ctrl+C to stop
echo.

python run.py
pause
