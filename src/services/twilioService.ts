// Detect environment
const isNetlify = typeof window !== 'undefined' && 
                  window.location.hostname !== 'localhost' && 
                  window.location.hostname !== '127.0.0.1' &&
                  window.location.hostname !== '0.0.0.0';

const isLocalhost = typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '0.0.0.0');

// Determine API URL based on environment
let API_URL = 'http://localhost:4000'; // Default for localhost
let USE_NETLIFY_FUNCTIONS = false;

if (typeof window !== 'undefined') {
    // On Netlify deployed site - use Netlify Functions
    if (isNetlify) {
        console.log('🌐 Detected Netlify environment');
        USE_NETLIFY_FUNCTIONS = true;
        API_URL = ''; // Relative path for Netlify Functions
    }
    // On localhost - try custom server first, fallback to Netlify Functions
    else if (isLocalhost) {
        console.log('🌐 Detected localhost environment');
        // Try environment variable for custom server URL
        if (import.meta.env.VITE_SERVER_URL) {
            API_URL = import.meta.env.VITE_SERVER_URL;
            console.log('🌐 Using custom server URL from env:', API_URL);
        } else {
            API_URL = 'http://localhost:4000';
            console.log('🌐 Using default localhost server');
        }
        USE_NETLIFY_FUNCTIONS = false;
    }
}

console.log('🌐 Twilio Service Configuration:');
console.log('  Environment:', isNetlify ? 'Netlify' : isLocalhost ? 'Localhost' : 'Unknown');
console.log('  API_URL:', API_URL);
console.log('  Use Netlify Functions:', USE_NETLIFY_FUNCTIONS);

export interface TwilioResponse {
    message: string;
    error?: string;
    status?: string;
    sid?: string;
    valid?: boolean;
}

export const twilioService = {
    async sendOTP(phoneNumber: string): Promise<TwilioResponse> {
        try {
            console.log('🚀 Starting OTP send process...');
            console.log('📱 Target phone number:', phoneNumber);
            console.log('🌐 API URL:', API_URL);
            
            // Validate phone number format
            if (!phoneNumber || phoneNumber.length < 10) {
                throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
            }
            
            // Ensure phone number has country code
            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                // Add default country code if missing (assuming India +91)
                formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
                console.log('📞 Auto-formatted phone number:', formattedPhone);
            }

            // First check if the server is running and configured for REAL SMS
            let serverHealthy = false;
            try {
                console.log('🔍 Checking server health...');
                const healthEndpoint = isNetlify ? '/.netlify/functions/health' : `${API_URL}/health`;
                console.log('📍 Health check endpoint:', healthEndpoint);
                
                const healthCheck = await fetch(healthEndpoint, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal: AbortSignal.timeout(3000) // 3 second timeout
                });
                
                if (!healthCheck.ok) {
                    throw new Error(`Server not responding (HTTP ${healthCheck.status})`);
                }
                
                const healthData = await healthCheck.json();
                console.log('🔍 Server health check result:', healthData);
                
                // Ensure we're using the REAL Twilio server, not mock
                if (healthData.mode === 'mock') {
                    throw new Error('Mock server detected');
                }
                
                if (!healthData.twilio?.configured) {
                    throw new Error('Twilio not configured on server');
                }
                
                serverHealthy = true;
                console.log('✅ Real Twilio server confirmed - ready to send SMS');
                console.log('🔧 Twilio Account SID:', healthData.twilio.accountSid);
                console.log('🔧 Twilio Service SID:', healthData.twilio.serviceSid);
            } catch (error: any) {
                console.error('❌ Server health check failed:', error.message);
                console.error('⚠️  Server not available - will use DEVELOPMENT MODE');
                console.error('');
                console.error('📋 TO USE REAL SMS:');
                console.error('1. Open a NEW terminal window');
                console.error('2. Run: npm start (from project root)');
                console.error('3. This will start both server and app');
                console.error('');
                console.error('Or manually:');
                console.error('1. cd server');
                console.error('2. npm install');
                console.error('3. npm start');
                console.error('');
                console.error('🔗 Get Twilio credentials from: https://console.twilio.com/');
                console.error('');
                
                // In development mode, we'll use mock OTP
                serverHealthy = false;
            }
            
            // If server is not healthy, use development mode with mock OTP
            if (!serverHealthy) {
                console.warn('');
                console.warn('🔄 DEVELOPMENT MODE: Using mock OTP for testing');
                console.warn('📝 For real SMS, start the OTP server');
                console.warn('');
                
                // Generate a mock OTP code
                const mockOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
                console.log('📋 MOCK OTP CODE (for development):', mockOtpCode);
                console.log('⚠️  This is NOT a real SMS - server not running');
                
                // Store mock OTP for verification
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`mock_otp_${formattedPhone}`, mockOtpCode);
                    console.log('✅ Mock OTP stored in session');
                }
                
                return {
                    message: `📝 DEVELOPMENT MODE: Mock OTP sent to ${formattedPhone}\n\n⚠️  This is NOT real SMS!\n\nMock OTP Code: ${mockOtpCode}\n\n🔄 To send REAL SMS:\n1. Run: npm start\n2. Or manually start server: cd server && npm start`,
                    status: 'pending',
                    sid: 'MOCK_' + Date.now(),
                    valid: true
                };
            }

            console.log('📱 Sending REAL SMS OTP to:', formattedPhone);
            const startTime = Date.now();
            
            // Determine endpoint based on environment
            let sendOtpEndpoint: string;
            if (USE_NETLIFY_FUNCTIONS) {
                sendOtpEndpoint = '/.netlify/functions/send-otp';
            } else {
                sendOtpEndpoint = `${API_URL}/api/send-otp`;
            }
            console.log('📍 Send OTP endpoint:', sendOtpEndpoint);
            
            const response = await fetch(sendOtpEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phoneNumber: formattedPhone })
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`⏱️ API response time: ${responseTime}ms`);
            
            const data = await response.json();
            console.log('📋 Server response:', data);
            
            if (!response.ok) {
                console.error('❌ Server returned error:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                throw new Error(data.error || `Server error (${response.status}): ${data.details || 'Failed to send real SMS OTP'}`);
            }
            
            console.log('✅ Real SMS OTP sent successfully!');
            console.log('📨 Message:', data.message);
            console.log('🆔 Verification SID:', data.sid);
            console.log('📊 Status:', data.status);
            
            return {
                ...data,
                message: `SMS OTP sent to ${formattedPhone}. Please check your phone for the verification code.`
            };
        } catch (error: any) {
            console.error('❌ Failed to send real SMS OTP:', error);
            console.error('🔍 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    },

    async verifyOTP(phoneNumber: string, otp: string): Promise<TwilioResponse> {
        try {
            console.log('🔐 Verifying OTP for:', phoneNumber);
            
            // Format phone number
            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
            }
            
            // Check if this is a mock OTP (development mode)
            const mockOtpStored = typeof window !== 'undefined' ? sessionStorage.getItem(`mock_otp_${formattedPhone}`) : null;
            if (mockOtpStored) {
                console.log('🔄 Checking mock OTP (development mode)...');
                if (otp === mockOtpStored) {
                    console.log('✅ Mock OTP verified successfully (development mode)');
                    return {
                        message: '✅ OTP verified successfully (development mode)',
                        status: 'approved',
                        valid: true
                    };
                } else {
                    console.error('❌ Mock OTP verification failed - code mismatch');
                    throw new Error('Invalid OTP code');
                }
            }
            
            // Real OTP verification via server
            let verifyOtpEndpoint: string;
            if (USE_NETLIFY_FUNCTIONS) {
                verifyOtpEndpoint = '/.netlify/functions/verify-otp';
            } else {
                verifyOtpEndpoint = `${API_URL}/api/verify-otp`;
            }
            console.log('📍 Verify OTP endpoint:', verifyOtpEndpoint);
            
            const response = await fetch(verifyOtpEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phoneNumber: formattedPhone, otp }),
                signal: AbortSignal.timeout(5000)
            });
            
            const data = await response.json();
            if (!response.ok) {
                console.error('❌ OTP verification failed:', data);
                throw new Error(data.error || 'Failed to verify OTP');
            }
            
            console.log('✅ OTP verified successfully:', data.message);
            return data;
        } catch (error: any) {
            console.error('❌ Failed to verify OTP:', error.message);
            throw new Error(`OTP verification failed: ${error.message}`);
        }
    },

    async sendDistressMessage(phoneNumber: string, message: string, userName: string, location: { lat: number; lng: number }): Promise<TwilioResponse> {
        try {
            console.log('🚨 Sending DISTRESS MESSAGE via SMS/WhatsApp...');
            console.log('📱 Target phone number:', phoneNumber);
            console.log('👤 From user:', userName);
            console.log('📍 Location:', location);
            
            // Validate phone number format
            if (!phoneNumber || phoneNumber.length < 10) {
                throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
            }
            
            // Ensure phone number has country code
            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                // Add default country code if missing (assuming India +91)
                formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
                console.log('📞 Auto-formatted phone number:', formattedPhone);
            }

            // Create comprehensive distress message
            const fullMessage = `🚨 EMERGENCY DISTRESS ALERT 🚨\n\nI NEED IMMEDIATE HELP!\n\nFrom: ${userName}\n\n📍 Location: https://maps.google.com/maps?q=${location.lat},${location.lng}\n\nCoordinates:\nLatitude: ${location.lat.toFixed(6)}\nLongitude: ${location.lng.toFixed(6)}\n\n⏰ Time: ${new Date().toLocaleString()}\n\n🆘 This is an automated SOS distress message. Contact me immediately!`;

            console.log('📨 Sending distress message to:', formattedPhone);
            const startTime = Date.now();
            
            // Determine endpoint based on environment
            let distressEndpoint: string;
            if (USE_NETLIFY_FUNCTIONS) {
                distressEndpoint = '/.netlify/functions/send-distress';
            } else {
                distressEndpoint = `${API_URL}/api/send-distress`;
            }
            console.log('📍 Distress endpoint:', distressEndpoint);
            
            const response = await fetch(distressEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    phoneNumber: formattedPhone,
                    message: fullMessage,
                    userName,
                    location: {
                        lat: parseFloat(location.lat.toString()),
                        lng: parseFloat(location.lng.toString())
                    }
                })
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`⏱️ API response time: ${responseTime}ms`);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, it's likely an error page (HTML)
                const text = await response.text();
                console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
                
                if (!response.ok) {
                    throw new Error(`Server error (${response.status}): Endpoint may not exist or server not running. Please ensure backend server is running on ${API_URL}`);
                }
                
                // Try to parse as JSON anyway
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(`Invalid response format: Expected JSON but got ${contentType || 'unknown'}`);
                }
            }
            
            console.log('📋 Server response:', data);
            
            if (!response.ok) {
                console.error('❌ Server returned error:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                throw new Error(data.error || `Server error (${response.status}): ${data.details || 'Failed to send distress message'}`);
            }
            
            console.log('✅ Distress message sent successfully!');
            console.log('📨 Message sent to:', formattedPhone);
            console.log('🆔 Message SID:', data.sid);
            
            return {
                ...data,
                message: `🚨 Distress alert sent to ${formattedPhone} via SMS/WhatsApp`
            };
        } catch (error: any) {
            console.error('❌ Failed to send distress message:', error);
            console.error('🔍 Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Provide helpful guidance
            if (error.message.includes('Endpoint may not exist') || error.message.includes('server not running')) {
                console.warn('⚠️ Backend server not running. To send real SMS:');
                console.warn('1. Navigate to server directory: cd server');
                console.warn('2. Start the server: npm start');
                console.warn('3. Ensure Twilio credentials are configured in server/.env');
                
                // Return mock success for development
                return {
                    sid: 'DEMO_' + Date.now(),
                    message: `🚨 [DEMO MODE] Distress alert would be sent to ${phoneNumber} (Server not running)`,
                    status: 'demo'
                } as any;
            }
            
            throw error;
        }
    }
};