@echo off
echo ========================================
echo  TimeBank Persistent SMS OTP Server
echo ========================================
echo.
echo Starting persistent SMS server...
echo This server will run continuously and auto-restart if needed.
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
node persistent-sms-server.js

pause
