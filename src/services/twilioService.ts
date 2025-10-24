const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

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
            try {
                console.log('🔍 Checking server health...');
                const healthCheck = await fetch(`${API_URL}/health`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!healthCheck.ok) {
                    throw new Error(`Server not responding (HTTP ${healthCheck.status}). Please start the server with: node server/start-real-sms.js`);
                }
                
                const healthData = await healthCheck.json();
                console.log('🔍 Server health check result:', healthData);
                
                // Ensure we're using the REAL Twilio server, not mock
                if (healthData.mode === 'mock') {
                    throw new Error('Mock server detected! Please start the REAL Twilio server using: node server/start-real-sms.js');
                }
                
                if (!healthData.twilio?.configured) {
                    throw new Error('Twilio is not properly configured on the server. Please check your .env file in the server directory with valid Twilio credentials.');
                }
                
                console.log('✅ Real Twilio server confirmed - ready to send SMS');
                console.log('🔧 Twilio Account SID:', healthData.twilio.accountSid);
                console.log('🔧 Twilio Service SID:', healthData.twilio.serviceSid);
            } catch (error: any) {
                console.error('❌ Server health check failed:', error.message);
                throw new Error(`OTP service error: ${error.message}`);
            }

            console.log('📱 Sending REAL SMS OTP to:', formattedPhone);
            const startTime = Date.now();
            
            const response = await fetch(`${API_URL}/api/send-otp`, {
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
            console.log('🔐 Verifying REAL SMS OTP for:', phoneNumber);
            const response = await fetch(`${API_URL}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phoneNumber, otp })
            });
            
            const data = await response.json();
            if (!response.ok) {
                console.error('❌ OTP verification failed:', data);
                throw new Error(data.error || 'Failed to verify real SMS OTP');
            }
            
            console.log('✅ Real SMS OTP verified successfully:', data.message);
            return data;
        } catch (error: any) {
            console.error('❌ Failed to verify real SMS OTP:', error.message);
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
            
            const response = await fetch(`${API_URL}/api/send-distress`, {
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