#!/usr/bin/env node

/**
 * COMPLETE AUTO-START SCRIPT
 * Starts both OTP server and Vite dev server automatically
 * Handles all setup, validation, and error recovery
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = __dirname;
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
const ENV_FILE = path.join(SERVER_DIR, '.env');
const ENV_EXAMPLE = path.join(SERVER_DIR, '.env.example');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        🚀 TIMEBANK COMPLETE AUTO-START SYSTEM 🚀           ║');
console.log('║                                                            ║');
console.log('║  Starting OTP Server + Vite Dev Server automatically       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');

// Step 1: Check and setup .env file
console.log('📋 STEP 1: Checking server configuration...');
console.log('─'.repeat(60));

if (!fs.existsSync(ENV_FILE)) {
  console.log('⚠️  server/.env not found');
  
  if (fs.existsSync(ENV_EXAMPLE)) {
    console.log('📝 Creating server/.env from .env.example...');
    const exampleContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
    fs.writeFileSync(ENV_FILE, exampleContent);
    console.log('✅ server/.env created');
    console.log('');
    console.log('⚠️  IMPORTANT: Edit server/.env with your Twilio credentials:');
    console.log('   1. Go to https://console.twilio.com/');
    console.log('   2. Get your Account SID, Auth Token, and Verify Service SID');
    console.log('   3. Update server/.env with these values');
    console.log('');
  } else {
    console.log('❌ Neither server/.env nor server/.env.example found');
    console.log('   Please create server/.env with Twilio credentials');
    process.exit(1);
  }
} else {
  console.log('✅ server/.env found');
  
  // Check if credentials are set
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const hasAccountSid = envContent.includes('TWILIO_ACCOUNT_SID=AC');
  const hasAuthToken = envContent.includes('TWILIO_AUTH_TOKEN=');
  const hasServiceSid = envContent.includes('TWILIO_SERVICE_SID=VA');
  
  if (hasAccountSid && hasAuthToken && hasServiceSid) {
    console.log('✅ Twilio credentials configured');
  } else {
    console.log('⚠️  Twilio credentials may not be properly set');
    console.log('   Check server/.env for TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID');
  }
}

console.log('\n');

// Step 2: Check and install server dependencies
console.log('📦 STEP 2: Checking server dependencies...');
console.log('─'.repeat(60));

const serverNodeModules = path.join(SERVER_DIR, 'node_modules');
if (!fs.existsSync(serverNodeModules)) {
  console.log('📥 Installing server dependencies (this may take a minute)...');
  
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const installProcess = spawn(npm, ['install'], {
      cwd: SERVER_DIR,
      stdio: 'inherit'
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Server dependencies installed');
        startServers();
      } else {
        console.error('❌ Failed to install server dependencies');
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Server dependencies already installed');
  console.log('\n');
  startServers();
}

function startServers() {
  console.log('🚀 STEP 3: Starting servers...');
  console.log('─'.repeat(60));
  
  let serverStarted = false;
  let appStarted = false;
  
  // Start OTP Server
  console.log('\n📱 Starting OTP Server on port 4000...');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  const serverProcess = spawn(npm, ['start'], {
    cwd: SERVER_DIR,
    stdio: 'pipe'
  });
  
  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    process.stdout.write(output);
    
    // Check if server is ready
    if (!serverStarted && output.includes('listening on port')) {
      serverStarted = true;
      console.log('✅ OTP Server started successfully on port 4000');
      console.log('');
      
      // Wait 2 seconds then start Vite app
      setTimeout(() => {
        startViteApp();
      }, 2000);
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0 && !serverStarted) {
      console.error('❌ OTP Server failed to start');
      console.error('Make sure Twilio credentials are set in server/.env');
      process.exit(1);
    }
  });
  
  // Start Vite App
  function startViteApp() {
    console.log('🎨 Starting Vite dev server on port 5173...');
    
    const viteProcess = spawn(npm, ['run', 'dev'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (!appStarted && (output.includes('Local:') || output.includes('ready in'))) {
        appStarted = true;
        console.log('');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                  ✅ ALL SYSTEMS READY ✅                   ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log('║                                                            ║');
        console.log('║  🌐 App:    http://localhost:5173                          ║');
        console.log('║  📱 Server: http://localhost:4000                          ║');
        console.log('║  🔍 Health: http://localhost:4000/health                   ║');
        console.log('║                                                            ║');
        console.log('║  ✅ OTP Server is running - Real SMS ready                 ║');
        console.log('║  ✅ Vite app is running - Open in browser                  ║');
        console.log('║                                                            ║');
        console.log('║  Press Ctrl+C to stop both servers                         ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('');
      }
    });
    
    viteProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    viteProcess.on('close', (code) => {
      console.log('Vite app stopped');
      process.exit(code);
    });
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Shutting down servers...');
      serverProcess.kill();
      viteProcess.kill();
      setTimeout(() => {
        console.log('✅ All servers stopped');
        process.exit(0);
      }, 1000);
    });
  }
}
