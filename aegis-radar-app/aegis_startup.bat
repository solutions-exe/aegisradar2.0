@echo off
echo.
echo ================================================
echo     AEGIS RADAR - Full System Startup
echo ================================================
echo.

start cmd /k "cd /d E:\aegis\backend && run_backend.bat"

echo Waiting 4 seconds for backend to start...
timeout /t 4 /nobreak >nul

start cmd /k "cd /d E:\aegis\frontend\aegis-radar-app && start_frontend.bat"

echo.
echo ✅ Both servers launched!
echo    Backend  → http://127.0.0.1:8000
echo    Frontend → http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul