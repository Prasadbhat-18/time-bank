const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twilio client
// Support both TWILIO_ and VITE_TWILIO_ prefixes
const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID || process.env.VITE_TWILIO_SERVICE_SID;

// Validate Twilio configuration
if (!accountSid || !authToken || !serviceSid) {
    console.error('❌ Twilio configuration missing:');
    console.error('TWILIO_ACCOUNT_SID or VITE_TWILIO_ACCOUNT_SID:', accountSid ? '✅ Set' : '❌ Missing');
    console.error('TWILIO_AUTH_TOKEN or VITE_TWILIO_AUTH_TOKEN:', authToken ? '✅ Set' : '❌ Missing');
    console.error('TWILIO_SERVICE_SID or VITE_TWILIO_SERVICE_SID:', serviceSid ? '✅ Set' : '❌ Missing');
    console.error('Please check your .env or .env.local file in the server directory');
    console.error('Available TWILIO vars:', Object.keys(process.env).filter(k => k.includes('TWILIO')));
} else {
    console.log('✅ Twilio configuration loaded successfully');
    console.log('📱 Ready to send real SMS via Twilio Verify');
    console.log('Account SID:', accountSid.substring(0, 4) + '...');
}

const client = twilio(accountSid, authToken);

// Add health check endpoint
app.get('/health', (req, res) => {
    const isConfigured = !!(accountSid && authToken && serviceSid);
    console.log('🔍 Health check requested');
    console.log('📊 Twilio configuration status:', isConfigured);
    
    res.json({ 
        status: 'ok',
        mode: 'real', // Explicitly indicate this is the real server
        timestamp: new Date().toISOString(),
        twilio: { 
            accountSid: accountSid ? accountSid.substr(0, 6) + '...' : 'NOT SET',
            serviceSid: serviceSid ? serviceSid.substr(0, 6) + '...' : 'NOT SET',
            configured: isConfigured,
            ready: isConfigured
        },
        server: {
            port: process.env.PORT || 4000,
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate Twilio is configured
        if (!accountSid || !authToken || !serviceSid) {
            return res.status(500).json({ 
                error: 'Twilio not configured properly. Please check server environment variables.' 
            });
        }

        console.log('📱 Sending REAL SMS OTP to:', phoneNumber);
        console.log('🔧 Using Twilio Service SID:', serviceSid);
        console.log('🔧 Using Twilio Account SID:', accountSid ? accountSid.substr(0, 6) + '...' : 'NOT SET');
        
        // Validate phone number format
        if (!phoneNumber.startsWith('+')) {
            return res.status(400).json({ 
                error: 'Phone number must include country code (e.g., +1234567890)' 
            });
        }

        const startTime = Date.now();
        
        // Send verification code using Twilio Verify
        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications
            .create({ 
                to: phoneNumber, 
                channel: 'sms',
                locale: 'en' // Ensure English language
            });

        const responseTime = Date.now() - startTime;
        console.log(`✅ Real SMS OTP sent successfully in ${responseTime}ms`);
        console.log('📊 Verification status:', verification.status);
        console.log('🆔 Verification SID:', verification.sid);
        console.log('📅 Valid until:', verification.validUntil);
        
        res.json({ 
            message: `Real SMS OTP sent successfully to ${phoneNumber}`,
            status: verification.status,
            sid: verification.sid,
            validUntil: verification.validUntil,
            responseTime: responseTime
        });
    } catch (error) {
        console.error('❌ Error sending real SMS OTP:', error);
        res.status(500).json({ 
            error: 'Failed to send real SMS OTP',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        // Validate Twilio is configured
        if (!accountSid || !authToken || !serviceSid) {
            return res.status(500).json({ 
                error: 'Twilio not configured properly. Please check server environment variables.' 
            });
        }

        console.log('🔐 Verifying REAL SMS OTP for:', phoneNumber);
        console.log('🔧 Using Twilio Service SID:', serviceSid);

        // Verify code using Twilio Verify
        const verification_check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: otp });

        console.log('✅ Real SMS OTP verification status:', verification_check.status);

        if (verification_check.status === 'approved') {
            res.json({ 
                message: 'Real SMS OTP verified successfully',
                status: verification_check.status,
                valid: true
            });
        } else {
            res.status(400).json({ 
                error: 'Invalid or expired OTP code',
                status: verification_check.status,
                valid: false
            });
        }
    } catch (error) {
        console.error('❌ Error verifying real SMS OTP:', error);
        res.status(500).json({ 
            error: 'Failed to verify real SMS OTP',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

// Send Distress Message endpoint (SOS)
app.post('/api/send-distress', async (req, res) => {
    try {
        const { phoneNumber, message, userName, location } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }

        // Validate Twilio is configured
        if (!accountSid || !authToken) {
            return res.status(500).json({ 
                error: 'Twilio not configured properly. Please check server environment variables.' 
            });
        }

        console.log('🚨 Sending DISTRESS MESSAGE via SMS...');
        console.log('📱 Target phone number:', phoneNumber);
        console.log('👤 From user:', userName);
        console.log('📍 Location:', location);
        
        // Validate phone number format
        if (!phoneNumber.startsWith('+')) {
            return res.status(400).json({ 
                error: 'Phone number must include country code (e.g., +1234567890)' 
            });
        }

        const startTime = Date.now();
        
        // Get Twilio phone number from environment or use a default
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (!twilioPhoneNumber) {
            console.warn('⚠️ TWILIO_PHONE_NUMBER not set in environment variables');
            console.warn('📋 Please add TWILIO_PHONE_NUMBER to your .env file');
            return res.status(500).json({ 
                error: 'Twilio phone number not configured',
                details: 'Please set TWILIO_PHONE_NUMBER in your .env file'
            });
        }
        
        // Send distress message via SMS using Twilio REST API
        const smsMessage = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: phoneNumber
        });

        const responseTime = Date.now() - startTime;
        console.log(`✅ Distress message sent successfully in ${responseTime}ms`);
        console.log('📊 Message status:', smsMessage.status);
        console.log('🆔 Message SID:', smsMessage.sid);
        console.log('📤 Sent from:', twilioPhoneNumber);
        console.log('📥 Sent to:', phoneNumber);
        
        res.json({ 
            message: `🚨 Distress alert sent successfully to ${phoneNumber} via SMS`,
            status: smsMessage.status,
            sid: smsMessage.sid,
            responseTime: responseTime,
            from: twilioPhoneNumber,
            to: phoneNumber
        });
    } catch (error) {
        console.error('❌ Error sending distress message:', error);
        console.error('🔍 Error code:', error.code);
        console.error('🔍 Error message:', error.message);
        res.status(500).json({ 
            error: 'Failed to send distress message',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Twilio Account SID: ${accountSid ? accountSid.substr(0, 6) + '...' : 'NOT SET'}`);
    console.log(`Twilio Service SID: ${serviceSid ? serviceSid.substr(0, 6) + '...' : 'NOT SET'}`);
});