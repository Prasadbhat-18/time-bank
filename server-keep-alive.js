#!/usr/bin/env node

/**
 * Server Keep-Alive Script
 * Ensures OTP server is always running with automatic restart on failure
 * Run: npm run server:keep-alive
 * 
 * Features:
 * - Auto-restarts server if it crashes
 * - Health checks every 30 seconds
 * - Logs all activity
 * - Graceful shutdown with Ctrl+C
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_PORT = process.env.PORT || 4000;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY = 5000; // 5 seconds

let serverProcess = null;
let restartCount = 0;
let isShuttingDown = false;

console.log('🚀 Starting Server Keep-Alive Monitor...\n');
console.log('📊 Configuration:');
console.log(`   Server Port: ${SERVER_PORT}`);
console.log(`   Health Check Interval: ${HEALTH_CHECK_INTERVAL / 1000}s`);
console.log(`   Max Restart Attempts: ${MAX_RESTART_ATTEMPTS}`);
console.log(`   Restart Delay: ${RESTART_DELAY / 1000}s\n`);

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

/**
 * Start the server process
 */
function startServer() {
  if (isShuttingDown) return;

  console.log(`\n📌 Starting OTP Server (Attempt ${restartCount + 1}/${MAX_RESTART_ATTEMPTS})...`);

  serverProcess = spawn('node', ['server/server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    scheduleRestart();
  });

  serverProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`\n⚠️  Server exited with code ${code}`);
      scheduleRestart();
    }
  });

  restartCount++;
}

/**
 * Schedule server restart with delay
 */
function scheduleRestart() {
  if (isShuttingDown) return;

  if (restartCount >= MAX_RESTART_ATTEMPTS) {
    console.error(`\n❌ Max restart attempts (${MAX_RESTART_ATTEMPTS}) reached!`);
    console.error('Please check server/.env and server logs for errors.');
    process.exit(1);
  }

  console.log(`⏳ Restarting server in ${RESTART_DELAY / 1000}s...\n`);
  setTimeout(startServer, RESTART_DELAY);
}

/**
 * Health check - verify server is responding
 */
function healthCheck() {
  const options = {
    hostname: 'localhost',
    port: SERVER_PORT,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Server is healthy`);
    } else {
      console.warn(`⚠️  [${new Date().toLocaleTimeString()}] Server returned status ${res.statusCode}`);
    }
  });

  req.on('error', (error) => {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Health check failed:`, error.message);
    if (!isShuttingDown && serverProcess) {
      console.log('🔄 Restarting server...');
      serverProcess.kill();
    }
  });

  req.on('timeout', () => {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Health check timeout`);
    req.destroy();
    if (!isShuttingDown && serverProcess) {
      console.log('🔄 Restarting server...');
      serverProcess.kill();
    }
  });

  req.end();
}

/**
 * Start health check interval
 */
function startHealthChecks() {
  console.log(`\n📡 Starting health checks every ${HEALTH_CHECK_INTERVAL / 1000}s...\n`);
  setInterval(healthCheck, HEALTH_CHECK_INTERVAL);
}

/**
 * Handle graceful shutdown
 */
function shutdown() {
  console.log('\n\n🛑 Shutting down...');
  isShuttingDown = true;

  if (serverProcess) {
    console.log('⏹️  Stopping OTP server...');
    serverProcess.kill();
  }

  setTimeout(() => {
    console.log('✅ Server Keep-Alive stopped');
    process.exit(0);
  }, 2000);
}

// Handle Ctrl+C
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

// Start health checks after 5 seconds (give server time to start)
setTimeout(startHealthChecks, 5000);

// Display status
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ Server Keep-Alive Monitor is ACTIVE');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nServer will:');
console.log('  ✅ Start automatically');
console.log('  ✅ Health check every 30 seconds');
console.log('  ✅ Auto-restart if it crashes');
console.log('  ✅ Log all activity');
console.log('\nPress Ctrl+C to stop\n');
