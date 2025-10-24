#!/usr/bin/env node

/**
 * Startup script to ensure REAL SMS OTP service is running
 * This script validates Twilio configuration and starts the real server
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting REAL SMS OTP Service...');
console.log('=====================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ ERROR: .env file not found!');
    console.error('📋 Please create a .env file in the server directory with your Twilio credentials:');
    console.error('');
    console.error('TWILIO_ACCOUNT_SID=your_account_sid_here');
    console.error('TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.error('TWILIO_SERVICE_SID=your_verify_service_sid_here');
    console.error('');
    console.error('💡 You can copy .env.example to .env and fill in your credentials');
    process.exit(1);
}

// Validate Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

console.log('🔍 Checking Twilio configuration...');

if (!accountSid || !authToken || !serviceSid) {
    console.error('❌ ERROR: Twilio configuration incomplete!');
    console.error('');
    console.error('Missing environment variables:');
    if (!accountSid) console.error('  - TWILIO_ACCOUNT_SID');
    if (!authToken) console.error('  - TWILIO_AUTH_TOKEN');
    if (!serviceSid) console.error('  - TWILIO_SERVICE_SID');
    console.error('');
    console.error('📋 Please update your .env file with valid Twilio credentials');
    console.error('🔗 Get them from: https://console.twilio.com/');
    process.exit(1);
}

console.log('✅ Twilio configuration validated');
console.log(`📱 Account SID: ${accountSid.substr(0, 6)}...`);
console.log(`🔧 Service SID: ${serviceSid.substr(0, 6)}...`);

// Check if mock server is accidentally running
const mockServerPath = path.join(__dirname, 'mock-server.js');
if (fs.existsSync(mockServerPath)) {
    console.warn('⚠️  WARNING: Mock server file detected!');
    console.warn('🔄 Renaming mock-server.js to prevent accidental usage...');
    try {
        fs.renameSync(mockServerPath, path.join(__dirname, 'mock-server.js.disabled'));
        console.log('✅ Mock server disabled');
    } catch (error) {
        console.warn('⚠️  Could not disable mock server:', error.message);
    }
}

console.log('');
console.log('🎯 Starting REAL Twilio SMS server...');
console.log('📱 Real SMS will be sent to phone numbers');
console.log('🚫 No mock/fake OTPs will be used');
console.log('');

// Start the real server
require('./server.js');
