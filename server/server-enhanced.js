const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

console.log('\n🚀 ========================================');
console.log('   TWILIO OTP SERVER - STARTING');
console.log('   ========================================\n');

// Get credentials from environment (check multiple sources)
const accountSid = process.env.TWILIO_ACCOUNT_SID || 
                   process.env.VITE_TWILIO_ACCOUNT_SID ||
                   process.env.AC_SID;

const authToken = process.env.TWILIO_AUTH_TOKEN || 
                  process.env.VITE_TWILIO_AUTH_TOKEN ||
                  process.env.AUTH_TOKEN;

const serviceSid = process.env.TWILIO_SERVICE_SID || 
                   process.env.VITE_TWILIO_SERVICE_SID ||
                   process.env.SERVICE_SID;

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ||
                          process.env.VITE_TWILIO_PHONE_NUMBER;

// Detailed logging of configuration
console.log('📋 CONFIGURATION CHECK:');
console.log('─────────────────────────────────────────');
console.log('Account SID:', accountSid ? `✅ ${accountSid.substring(0, 6)}...` : '❌ MISSING');
console.log('Auth Token:', authToken ? `✅ ${authToken.substring(0, 6)}...` : '❌ MISSING');
console.log('Service SID:', serviceSid ? `✅ ${serviceSid.substring(0, 6)}...` : '❌ MISSING');
console.log('Phone Number:', twilioPhoneNumber ? `✅ ${twilioPhoneNumber}` : '⚠️  OPTIONAL');
console.log('─────────────────────────────────────────\n');

// Validate critical configuration
const isConfigured = !!(accountSid && authToken && serviceSid);

if (!isConfigured) {
    console.error('❌ CRITICAL ERROR: Twilio credentials are missing!');
    console.error('\n📋 SETUP INSTRUCTIONS:');
    console.error('1. Create server/.env file with:');
    console.error('   TWILIO_ACCOUNT_SID=your_account_sid');
    console.error('   TWILIO_AUTH_TOKEN=your_auth_token');
    console.error('   TWILIO_SERVICE_SID=your_service_sid');
    console.error('   TWILIO_PHONE_NUMBER=your_twilio_phone (optional)');
    console.error('\n2. Get credentials from: https://console.twilio.com/');
    console.error('\n3. Restart the server\n');
    
    // Still start server but with limited functionality
    console.warn('⚠️  Starting server in LIMITED MODE (OTP will not work)\n');
} else {
    console.log('✅ Twilio configuration VALID');
    console.log('📱 Real SMS OTP service READY\n');
}

// Initialize Twilio client (even if not configured, to avoid crashes)
let client = null;
try {
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
        console.log('✅ Twilio client initialized successfully\n');
    }
} catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
    console.log('🔍 Health check requested');
    
    res.json({ 
        status: 'ok',
        mode: 'real',
        timestamp: new Date().toISOString(),
        twilio: { 
            accountSid: accountSid ? accountSid.substr(0, 6) + '...' : 'NOT SET',
            serviceSid: serviceSid ? serviceSid.substr(0, 6) + '...' : 'NOT SET',
            configured: isConfigured,
            ready: isConfigured && client !== null
        },
        server: {
            port: process.env.PORT || 4000,
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime()
        }
    });
});

// ============================================
// SEND OTP ENDPOINT
// ============================================
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate Twilio is configured
        if (!isConfigured || !client) {
            console.error('❌ Twilio not configured - cannot send OTP');
            return res.status(500).json({ 
                error: 'Twilio not configured',
                details: 'Please check server environment variables',
                configured: isConfigured,
                clientReady: client !== null
            });
        }

        // Validate phone number format
        if (!phoneNumber.startsWith('+')) {
            return res.status(400).json({ 
                error: 'Phone number must include country code (e.g., +919876543210)' 
            });
        }

        console.log('\n📱 SENDING OTP');
        console.log('─────────────────────────────────────────');
        console.log('Phone:', phoneNumber);
        console.log('Service SID:', serviceSid.substring(0, 6) + '...');
        
        const startTime = Date.now();
        
        try {
            // Send verification code using Twilio Verify
            const verification = await client.verify.v2
                .services(serviceSid)
                .verifications
                .create({ 
                    to: phoneNumber, 
                    channel: 'sms',
                    locale: 'en'
                });

            const responseTime = Date.now() - startTime;
            console.log('✅ OTP SENT SUCCESSFULLY');
            console.log('Status:', verification.status);
            console.log('SID:', verification.sid);
            console.log('Time:', responseTime + 'ms');
            console.log('─────────────────────────────────────────\n');
            
            res.json({ 
                message: `✅ Real SMS OTP sent to ${phoneNumber}`,
                status: verification.status,
                sid: verification.sid,
                validUntil: verification.validUntil,
                responseTime: responseTime,
                success: true
            });
        } catch (twilioError) {
            console.error('❌ Twilio API Error:', twilioError.message);
            console.error('Code:', twilioError.code);
            console.error('─────────────────────────────────────────\n');
            
            res.status(500).json({ 
                error: 'Failed to send OTP via Twilio',
                details: twilioError.message,
                code: twilioError.code,
                success: false
            });
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        res.status(500).json({ 
            error: 'Unexpected server error',
            details: error.message,
            success: false
        });
    }
});

// ============================================
// VERIFY OTP ENDPOINT
// ============================================
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        // Validate Twilio is configured
        if (!isConfigured || !client) {
            return res.status(500).json({ 
                error: 'Twilio not configured',
                details: 'Please check server environment variables'
            });
        }

        console.log('\n🔐 VERIFYING OTP');
        console.log('─────────────────────────────────────────');
        console.log('Phone:', phoneNumber);
        console.log('OTP:', otp);
        
        try {
            // Verify code using Twilio Verify
            const verification_check = await client.verify.v2
                .services(serviceSid)
                .verificationChecks
                .create({ to: phoneNumber, code: otp });

            console.log('Status:', verification_check.status);
            console.log('─────────────────────────────────────────\n');

            if (verification_check.status === 'approved') {
                console.log('✅ OTP VERIFIED SUCCESSFULLY\n');
                res.json({ 
                    message: '✅ OTP verified successfully',
                    status: verification_check.status,
                    valid: true,
                    success: true
                });
            } else {
                console.log('❌ OTP VERIFICATION FAILED\n');
                res.status(400).json({ 
                    error: 'Invalid or expired OTP',
                    status: verification_check.status,
                    valid: false,
                    success: false
                });
            }
        } catch (twilioError) {
            console.error('❌ Twilio API Error:', twilioError.message);
            console.error('─────────────────────────────────────────\n');
            
            res.status(500).json({ 
                error: 'Failed to verify OTP',
                details: twilioError.message,
                code: twilioError.code,
                success: false
            });
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        res.status(500).json({ 
            error: 'Unexpected server error',
            details: error.message,
            success: false
        });
    }
});

// ============================================
// SEND DISTRESS MESSAGE ENDPOINT
// ============================================
app.post('/api/send-distress', async (req, res) => {
    try {
        const { phoneNumber, message, userName, location } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }

        if (!isConfigured || !client) {
            return res.status(500).json({ 
                error: 'Twilio not configured',
                details: 'Please check server environment variables'
            });
        }

        if (!twilioPhoneNumber) {
            return res.status(500).json({ 
                error: 'Twilio phone number not configured',
                details: 'Please set TWILIO_PHONE_NUMBER in .env'
            });
        }

        console.log('\n🚨 SENDING DISTRESS MESSAGE');
        console.log('─────────────────────────────────────────');
        console.log('To:', phoneNumber);
        console.log('From:', twilioPhoneNumber);
        console.log('User:', userName);
        
        try {
            const smsMessage = await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: phoneNumber
            });

            console.log('✅ DISTRESS MESSAGE SENT');
            console.log('SID:', smsMessage.sid);
            console.log('Status:', smsMessage.status);
            console.log('─────────────────────────────────────────\n');
            
            res.json({ 
                message: `🚨 Distress alert sent to ${phoneNumber}`,
                status: smsMessage.status,
                sid: smsMessage.sid,
                success: true
            });
        } catch (twilioError) {
            console.error('❌ Twilio API Error:', twilioError.message);
            console.error('─────────────────────────────────────────\n');
            
            res.status(500).json({ 
                error: 'Failed to send distress message',
                details: twilioError.message,
                code: twilioError.code,
                success: false
            });
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        res.status(500).json({ 
            error: 'Unexpected server error',
            details: error.message,
            success: false
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log('\n✅ ========================================');
    console.log('   SERVER RUNNING');
    console.log('   ========================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/health`);
    console.log(`📱 Send OTP: POST http://localhost:${PORT}/api/send-otp`);
    console.log(`🔐 Verify OTP: POST http://localhost:${PORT}/api/verify-otp`);
    console.log(`🚨 Distress: POST http://localhost:${PORT}/api/send-distress`);
    console.log('✅ ========================================\n');
    
    if (isConfigured) {
        console.log('🎉 Twilio is CONFIGURED - Real SMS will be sent!\n');
    } else {
        console.log('⚠️  Twilio is NOT configured - OTP will NOT work!\n');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
