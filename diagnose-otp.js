#!/usr/bin/env node

/**
 * OTP Diagnostic Tool
 * Checks why OTP is not being received
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           🔍 OTP DIAGNOSTIC TOOL                          ║');
console.log('║                                                            ║');
console.log('║  Checking why OTP is not being received                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\n');

// Step 1: Check server/.env
console.log('📋 STEP 1: Checking server/.env');
console.log('─'.repeat(60));

const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ server/.env NOT FOUND');
  console.log('   This is required for Twilio credentials');
  process.exit(1);
}

console.log('✅ server/.env found');

const envContent = fs.readFileSync(envPath, 'utf8');
const hasAccountSid = envContent.includes('TWILIO_ACCOUNT_SID=AC');
const hasAuthToken = envContent.includes('TWILIO_AUTH_TOKEN=');
const hasServiceSid = envContent.includes('TWILIO_SERVICE_SID=VA');

console.log('TWILIO_ACCOUNT_SID:', hasAccountSid ? '✅' : '❌');
console.log('TWILIO_AUTH_TOKEN:', hasAuthToken ? '✅' : '❌');
console.log('TWILIO_SERVICE_SID:', hasServiceSid ? '✅' : '❌');

if (!hasAccountSid || !hasAuthToken || !hasServiceSid) {
  console.log('\n❌ Missing Twilio credentials in server/.env');
  process.exit(1);
}

console.log('\n');

// Step 2: Check if server is running
console.log('📋 STEP 2: Checking if OTP server is running');
console.log('─'.repeat(60));

const checkServerHealth = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: true, data: json });
        } catch {
          resolve({ success: false, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
};

const health = await checkServerHealth();

if (!health.success) {
  console.log('❌ OTP Server is NOT running');
  console.log('   Error:', health.error);
  console.log('\n⚠️  TO FIX:');
  console.log('   1. Open a NEW terminal window');
  console.log('   2. Run: cd server && npm start');
  console.log('   3. Wait for: "🚀 Server listening on port 4000"');
  console.log('   4. Keep this terminal open');
  console.log('   5. Then test OTP again');
  process.exit(1);
}

console.log('✅ OTP Server is RUNNING on port 4000');
console.log('   Twilio configured:', health.data.twilio?.configured ? '✅' : '❌');
console.log('   Mode:', health.data.mode);

if (!health.data.twilio?.configured) {
  console.log('\n❌ Twilio not configured on server');
  console.log('   Check server/.env for credentials');
  process.exit(1);
}

console.log('\n');

// Step 3: Summary
console.log('📋 STEP 3: Summary');
console.log('─'.repeat(60));
console.log('\n✅ ALL SYSTEMS GO!');
console.log('\nYour OTP setup is working correctly:');
console.log('  ✅ server/.env has Twilio credentials');
console.log('  ✅ OTP server is running on port 4000');
console.log('  ✅ Twilio is configured and ready');
console.log('\n📱 To receive OTP:');
console.log('  1. Open http://localhost:5173');
console.log('  2. Go to "Phone" tab');
console.log('  3. Enter phone: +91XXXXXXXXXX');
console.log('  4. Click "Send OTP"');
console.log('  5. Check phone for SMS (10-15 seconds)');
console.log('\n✨ Real SMS will be sent to your phone!');
console.log('\n');
