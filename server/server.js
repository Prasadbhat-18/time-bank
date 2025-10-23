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
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Store OTPs temporarily (in production, use a proper database)
const otpStore = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with timestamp
        otpStore.set(phoneNumber, {
            otp,
            timestamp: Date.now()
        });

        // Send SMS using Twilio
        await client.messages.create({
            body: `Your Time Bank verification code is: ${otp}`,
            to: phoneNumber,
            from: twilioPhoneNumber
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const storedData = otpStore.get(phoneNumber);
    
    if (!storedData) {
        return res.status(400).json({ error: 'No OTP found for this number' });
    }

    // Check if OTP is expired (5 minutes validity)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
        otpStore.delete(phoneNumber);
        return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clear the OTP after successful verification
    otpStore.delete(phoneNumber);
    
    res.json({ message: 'OTP verified successfully' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});