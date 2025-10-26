#!/usr/bin/env node

/**
 * OTP Server Startup Script
 * Starts the Twilio OTP server on port 4000
 * Run this in a separate terminal: node start-otp-server.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting OTP Server...\n');

// Check if server/.env exists
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  server/.env not found');
  console.log('📝 Create server/.env with Twilio credentials:');
  console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
  console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
  console.log('   TWILIO_SERVICE_SID=your_service_sid');
  console.log('   PORT=4000\n');
}

// Start the server
const serverProcess = spawn('node', ['server/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`\n⏹️  Server stopped with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping OTP server...');
  serverProcess.kill();
  process.exit(0);
});
