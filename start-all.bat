@echo off
REM Start both OTP Server and Vite dev server together
REM This ensures Twilio server is always running

echo.
echo ========================================
echo  TimeBank - Starting with OTP Server
echo ========================================
echo.

REM Check if server/.env exists
if not exist "server\.env" (
    echo ERROR: server\.env file not found!
    echo.
    echo Please create server\.env with your Twilio credentials:
    echo 1. Copy server\.env.example to server\.env
    echo 2. Fill in your Twilio credentials
    echo.
    pause
    exit /b 1
)

REM Check if server/node_modules exists
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

REM Start the OTP server in a new window
echo Starting OTP Server on port 4000...
start "TimeBank OTP Server" cmd /k "cd server && npm start"

REM Wait for server to start
timeout /t 3 /nobreak

REM Start the Vite dev server
echo Starting Vite dev server on port 5173...
echo.
echo ========================================
echo  App will open at http://localhost:5173
echo  OTP Server running at http://localhost:4000
echo ========================================
echo.

npm run dev

pause
