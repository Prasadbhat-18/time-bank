const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export interface TwilioResponse {
    message: string;
    error?: string;
}

export const twilioService = {
    async sendOTP(phoneNumber: string): Promise<TwilioResponse> {
        try {
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
                throw new Error(data.error || 'Failed to send OTP');
            }
            
            return data;
        } catch (error: any) {
            console.error('Failed to send OTP:', error.message);
            throw new Error('Failed to connect to OTP service. Please try again.');
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