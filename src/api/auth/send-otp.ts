// DEPRECATED: This client-side OTP service has been replaced
// All OTP operations now go through the server-side Twilio service
// This ensures proper security and real SMS delivery

export const sendOTP = async (phoneNumber: string) => {
  throw new Error('Client-side OTP service is deprecated. Use server-side twilioService instead.');
};

export const verifyOTP = async (verificationId: string, code: string) => {
  throw new Error('Client-side OTP service is deprecated. Use server-side twilioService instead.');
};