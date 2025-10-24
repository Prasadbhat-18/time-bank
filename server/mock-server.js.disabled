const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mode: 'mock',
        message: 'Mock OTP server running - OTPs will be logged to console' 
    });
});

// Send OTP endpoint (mock)
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Generate and store OTP
        const otp = generateOTP();
        otpStore.set(phoneNumber, {
            otp: otp,
            timestamp: Date.now(),
            attempts: 0
        });

        // Log OTP to console (in real app, this would be sent via SMS)
        console.log('📱 MOCK OTP for', phoneNumber, ':', otp);
        console.log('🔔 Use this OTP in the app:', otp);

        res.json({ 
            message: 'OTP sent successfully (check console for OTP)',
            status: 'pending',
            mockOTP: otp // Only for development - remove in production
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: error.message 
        });
    }
});

// Verify OTP endpoint (mock)
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        const stored = otpStore.get(phoneNumber);
        
        if (!stored) {
            return res.status(400).json({ 
                error: 'No OTP found for this phone number. Please request a new OTP.' 
            });
        }

        // Check if OTP is expired (5 minutes)
        const isExpired = (Date.now() - stored.timestamp) > 5 * 60 * 1000;
        if (isExpired) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ 
                error: 'OTP has expired. Please request a new OTP.' 
            });
        }

        // Check attempts (max 3)
        if (stored.attempts >= 3) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ 
                error: 'Too many failed attempts. Please request a new OTP.' 
            });
        }

        // Verify OTP
        if (stored.otp === otp) {
            otpStore.delete(phoneNumber); // Remove after successful verification
            console.log('✅ OTP verified successfully for', phoneNumber);
            res.json({ 
                message: 'OTP verified successfully',
                status: 'approved' 
            });
        } else {
            stored.attempts++;
            otpStore.set(phoneNumber, stored);
            console.log('❌ Invalid OTP attempt for', phoneNumber, '- Attempts:', stored.attempts);
            res.status(400).json({ 
                error: 'Invalid OTP. Please try again.',
                attemptsLeft: 3 - stored.attempts
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
    console.log(`🚀 Mock OTP Server running on port ${PORT}`);
    console.log(`📱 Mode: MOCK - OTPs will be logged to console`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`⚠️  For production, use real Twilio server (server.js)`);
});
