import twilio from 'twilio';

const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const serviceSid = import.meta.env.VITE_TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

export const sendOTP = async (phoneNumber: string) => {
  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    return {
      success: true,
      verificationId: verification.sid
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification code'
    };
  }
};

export const verifyOTP = async (verificationId: string, code: string) => {
  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verificationChecks
      .create({ to: verificationId, code });

    return {
      success: verification.status === 'approved',
      error: verification.status !== 'approved' ? 'Invalid verification code' : undefined
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify code'
    };
  }
};