@echo off
echo Starting TimeBank OTP Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to server directory
cd /d "%~dp0server"

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please follow these steps:
    echo 1. Copy .env.example to .env
    echo 2. Get Twilio credentials from https://console.twilio.com/
    echo 3. Update .env with your Twilio Account SID, Auth Token, and Service SID
    echo.
    echo See server/README.md for detailed setup instructions
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting server on http://localhost:4000
echo Press Ctrl+C to stop the server
echo.
npm run dev
