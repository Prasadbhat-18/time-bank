const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

class TwilioAuthService {
  async sendVerificationCode(phoneNumber: string): Promise<boolean> {
    const res = await fetch(`${BASE}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to send OTP');
    return true;
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const res = await fetch(`${BASE}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp: code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to verify OTP');
    return true;
  }
}

export const twilioAuthService = new TwilioAuthService();