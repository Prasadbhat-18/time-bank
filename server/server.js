const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken);

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', twilio: { accountSid, serviceSid } });
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        console.log('Attempting to send OTP to:', phoneNumber);
        console.log('Using Twilio Service SID:', serviceSid);

        // Send verification code using Twilio Verify
        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });

        console.log('Verification sent:', verification.status);
        res.json({ 
            message: 'OTP sent successfully',
            status: verification.status 
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: error.message 
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

        console.log('Attempting to verify OTP for:', phoneNumber);

        // Verify code using Twilio Verify
        const verification_check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: otp });

        console.log('Verification check status:', verification_check.status);

        if (verification_check.status === 'approved') {
            res.json({ 
                message: 'OTP verified successfully',
                status: verification_check.status 
            });
        } else {
            res.status(400).json({ 
                error: 'Invalid OTP',
                status: verification_check.status 
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            error: 'Failed to verify OTP',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Twilio Account SID: ${accountSid ? accountSid.substr(0, 6) + '...' : 'NOT SET'}`);
    console.log(`Twilio Service SID: ${serviceSid ? serviceSid.substr(0, 6) + '...' : 'NOT SET'}`);
});