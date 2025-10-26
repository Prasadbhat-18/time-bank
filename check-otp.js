#!/usr/bin/env node

/**
 * Simple OTP Setup Checker
 * Checks if Twilio is configured and ready
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           ✅ OTP SETUP CHECKER                            ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');

// Check server/.env file
const envPath = path.join(__dirname, 'server', '.env');
console.log('📋 Checking server/.env file...');
console.log('─'.repeat(60));

if (!fs.existsSync(envPath)) {
  console.log('❌ server/.env NOT FOUND');
  console.log('\n⚠️  To setup OTP:');
  console.log('1. Go to https://console.twilio.com/');
  console.log('2. Get your Account SID, Auth Token, and Verify Service SID');
  console.log('3. Create server/.env with:');
  console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
  console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
  console.log('   TWILIO_SERVICE_SID=your_service_sid');
  console.log('   PORT=4000');
  console.log('   NODE_ENV=development');
  console.log('');
  process.exit(1);
}

console.log('✅ server/.env found');

// Read and check credentials
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let hasAccountSid = false;
let hasAuthToken = false;
let hasServiceSid = false;
let hasPort = false;

for (const line of lines) {
  if (line.startsWith('TWILIO_ACCOUNT_SID=') && line.includes('AC')) hasAccountSid = true;
  if (line.startsWith('TWILIO_AUTH_TOKEN=') && line.length > 20) hasAuthToken = true;
  if (line.startsWith('TWILIO_SERVICE_SID=') && line.includes('VA')) hasServiceSid = true;
  if (line.startsWith('PORT=')) hasPort = true;
}

console.log('\n📋 Checking Twilio credentials...');
console.log('─'.repeat(60));
console.log('TWILIO_ACCOUNT_SID:', hasAccountSid ? '✅ Configured' : '❌ Missing or invalid');
console.log('TWILIO_AUTH_TOKEN:', hasAuthToken ? '✅ Configured' : '❌ Missing or invalid');
console.log('TWILIO_SERVICE_SID:', hasServiceSid ? '✅ Configured' : '❌ Missing or invalid');
console.log('PORT:', hasPort ? '✅ Configured' : '❌ Missing');

console.log('\n📋 Checking server files...');
console.log('─'.repeat(60));

const serverFile = path.join(__dirname, 'server', 'server.js');
const packageFile = path.join(__dirname, 'server', 'package.json');

console.log('server/server.js:', fs.existsSync(serverFile) ? '✅ Exists' : '❌ Missing');
console.log('server/package.json:', fs.existsSync(packageFile) ? '✅ Exists' : '❌ Missing');

console.log('\n📋 Checking start scripts...');
console.log('─'.repeat(60));

const startEverything = path.join(__dirname, 'start-everything.js');
const mainPackage = path.join(__dirname, 'package.json');

console.log('start-everything.js:', fs.existsSync(startEverything) ? '✅ Exists' : '❌ Missing');
console.log('package.json:', fs.existsSync(mainPackage) ? '✅ Exists' : '❌ Missing');

if (fs.existsSync(mainPackage)) {
  const pkg = JSON.parse(fs.readFileSync(mainPackage, 'utf8'));
  const hasStart = pkg.scripts?.start;
  console.log('npm start script:', hasStart ? `✅ Configured` : '❌ Not configured');
}

console.log('\n');

if (hasAccountSid && hasAuthToken && hasServiceSid) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            ✅ OTP IS READY TO USE!                        ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log('║  Next steps:                                               ║');
  console.log('║  1. Run: npm start                                         ║');
  console.log('║  2. Open: http://localhost:5173                            ║');
  console.log('║  3. Go to "Phone" tab                                      ║');
  console.log('║  4. Enter phone: +91XXXXXXXXXX                             ║');
  console.log('║  5. Click "Send OTP"                                       ║');
  console.log('║  6. Check phone for SMS (10-15 seconds)                    ║');
  console.log('║  7. Enter code and verify                                  ║');
  console.log('║                                                            ║');
  console.log('║  ✅ Real SMS via Twilio                                    ║');
  console.log('║  ✅ Cross-device sync with Firebase                        ║');
  console.log('║  ✅ Real-time chat and bookings                            ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
} else {
  console.log('❌ OTP SETUP INCOMPLETE');
  console.log('\nMissing credentials:');
  if (!hasAccountSid) console.log('  - TWILIO_ACCOUNT_SID');
  if (!hasAuthToken) console.log('  - TWILIO_AUTH_TOKEN');
  if (!hasServiceSid) console.log('  - TWILIO_SERVICE_SID');
  console.log('\nTo fix:');
  console.log('1. Go to https://console.twilio.com/');
  console.log('2. Get your credentials');
  console.log('3. Update server/.env with the values');
}

console.log('\n');
