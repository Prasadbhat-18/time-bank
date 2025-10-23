import twilio from 'twilio';

const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const serviceSid = import.meta.env.VITE_TWILIO_SERVICE_SID;
const fromPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const twilioService = {
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications
        .create({ to: phoneNumber, channel: 'sms' });
      
      return verification.sid;
    } catch (error: any) {
      console.error('Error sending verification:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  },

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks
        .create({ to: phoneNumber, code });

      return verificationCheck.status === 'approved';
    } catch (error: any) {
      console.error('Error verifying code:', error);
      throw new Error(error.message || 'Failed to verify code');
    }
  },

  async sendNotification(to: string, message: string): Promise<boolean> {
    try {
      const notification = await client.messages.create({
        body: message,
        from: fromPhoneNumber,
        to: to
      });
      
      return !!notification.sid;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      throw new Error(error.message || 'Failed to send notification');
    }
  }
};