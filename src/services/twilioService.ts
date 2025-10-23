const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export interface TwilioResponse {
    message: string;
    error?: string;
}

export const twilioService = {
    async sendOTP(phoneNumber: string): Promise<TwilioResponse> {
        try {
            // First check if the server is running
            try {
                const healthCheck = await fetch(`${API_URL}/health`);
                if (!healthCheck.ok) {
                    throw new Error('Server is not responding');
                }
                const healthData = await healthCheck.json();
                console.log('Server health check:', healthData);
            } catch (error) {
                throw new Error('OTP service is not available. Please try again later.');
            }

            console.log('Sending OTP to:', phoneNumber, 'using API URL:', API_URL);
            const response = await fetch(`${API_URL}/api/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phoneNumber })
            });
            
            const data = await response.json();
            if (!response.ok) {
                console.error('Server returned error:', data);
                throw new Error(data.error || 'Failed to send OTP');
            }
            
            return data;
        } catch (error: any) {
            console.error('Failed to send OTP:', error);
            throw error;
        }
    },

    async verifyOTP(phoneNumber: string, otp: string): Promise<TwilioResponse> {
        try {
            console.log('Verifying OTP for:', phoneNumber);
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
                throw new Error(data.error || 'Failed to verify OTP');
            }
            
            return data;
        } catch (error: any) {
            console.error('Failed to verify OTP:', error.message);
            throw new Error('Failed to verify OTP. Please try again.');
        }
    }
};