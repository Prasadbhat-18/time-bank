# Start both OTP Server and Vite dev server together
# This ensures Twilio server is always running

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TimeBank - Starting with OTP Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if server/.env exists
if (-not (Test-Path "server\.env")) {
    Write-Host "ERROR: server\.env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create server\.env with your Twilio credentials:" -ForegroundColor Yellow
    Write-Host "1. Copy server\.env.example to server\.env" -ForegroundColor Yellow
    Write-Host "2. Fill in your Twilio credentials" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if server/node_modules exists
if (-not (Test-Path "server\node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Push-Location server
    npm install
    Pop-Location
}

# Start the OTP server in a new PowerShell window
Write-Host "Starting OTP Server on port 4000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PWD\server'; npm start`""

# Wait for server to start
Start-Sleep -Seconds 3

# Start the Vite dev server
Write-Host "Starting Vite dev server on port 5173..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  App will open at http://localhost:5173" -ForegroundColor Cyan
Write-Host "  OTP Server running at http://localhost:4000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
