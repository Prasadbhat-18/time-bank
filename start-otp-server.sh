#!/bin/bash

echo "Starting TimeBank OTP Server..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Navigate to server directory
cd "$(dirname "$0")/server"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo
    echo "Please follow these steps:"
    echo "1. Copy .env.example to .env"
    echo "2. Get Twilio credentials from https://console.twilio.com/"
    echo "3. Update .env with your Twilio Account SID, Auth Token, and Service SID"
    echo
    echo "See server/README.md for detailed setup instructions"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo "Starting server on http://localhost:4000"
echo "Press Ctrl+C to stop the server"
echo
npm run dev
