#!/usr/bin/env node

/**
 * Start both the OTP server and the Vite dev server together
 * This ensures the Twilio server is always running
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting TimeBank with OTP Server...');
console.log('=====================================\n');

// Check if server .env exists
const serverEnvPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(serverEnvPath)) {
    console.error('❌ ERROR: server/.env file not found!');
    console.error('📋 Please create server/.env with your Twilio credentials');
    console.error('   Copy from server/.env.example and fill in your credentials\n');
    process.exit(1);
}

// Start the OTP server
console.log('📱 Starting OTP Server on port 4000...');
const serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    shell: true
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

// Wait a bit for server to start, then start the app
setTimeout(() => {
    console.log('\n🎨 Starting Vite dev server on port 5173...\n');
    const appProcess = spawn('npm', ['run', 'dev'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    appProcess.on('error', (error) => {
        console.error('❌ Failed to start app:', error);
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down...');
        serverProcess.kill();
        appProcess.kill();
        process.exit(0);
    });
}, 2000);

// Handle server errors
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    serverProcess.kill();
    process.exit(0);
});
