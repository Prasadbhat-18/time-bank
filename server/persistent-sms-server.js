#!/usr/bin/env node

/**
 * Persistent SMS OTP Server with Auto-Restart
 * This server runs continuously and automatically restarts if it crashes
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Persistent SMS OTP Server...');
console.log('🔄 This server will run continuously and auto-restart if needed');
console.log('=====================================');

let serverProcess = null;
let restartCount = 0;
const maxRestarts = 10;
const restartDelay = 5000; // 5 seconds

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

function startServer() {
    console.log(`🎯 Starting SMS server (attempt ${restartCount + 1})...`);
    
    const serverScript = path.join(__dirname, 'start-real-sms.js');
    
    serverProcess = spawn('node', [serverScript], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: __dirname
    });

    // Log server output
    const logFile = path.join(logsDir, `sms-server-${Date.now()}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    serverProcess.stdout.on('data', (data) => {
        const message = data.toString();
        process.stdout.write(message);
        logStream.write(`[STDOUT] ${new Date().toISOString()}: ${message}`);
    });

    serverProcess.stderr.on('data', (data) => {
        const message = data.toString();
        process.stderr.write(message);
        logStream.write(`[STDERR] ${new Date().toISOString()}: ${message}`);
    });

    serverProcess.on('close', (code) => {
        logStream.end();
        
        if (code !== 0) {
            console.error(`❌ SMS server exited with code ${code}`);
            
            if (restartCount < maxRestarts) {
                restartCount++;
                console.log(`🔄 Restarting server in ${restartDelay/1000} seconds... (${restartCount}/${maxRestarts})`);
                
                setTimeout(() => {
                    startServer();
                }, restartDelay);
            } else {
                console.error(`💥 Maximum restart attempts (${maxRestarts}) reached. Server stopped.`);
                process.exit(1);
            }
        } else {
            console.log('✅ SMS server stopped gracefully');
        }
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Failed to start SMS server:', error.message);
        
        if (restartCount < maxRestarts) {
            restartCount++;
            console.log(`🔄 Retrying in ${restartDelay/1000} seconds... (${restartCount}/${maxRestarts})`);
            
            setTimeout(() => {
                startServer();
            }, restartDelay);
        }
    });

    // Reset restart count on successful run (after 30 seconds)
    setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
            restartCount = 0;
            console.log('✅ Server running stable - restart counter reset');
        }
    }, 30000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down persistent SMS server...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM - shutting down...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
    process.exit(0);
});

// Start the server
startServer();

console.log('');
console.log('📱 Persistent SMS OTP Server is now running!');
console.log('🔄 The server will automatically restart if it crashes');
console.log('🛑 Press Ctrl+C to stop the server');
console.log('📊 Logs are saved in the logs/ directory');
console.log('');
