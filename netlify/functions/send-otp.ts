import { Handler } from '@netlify/functions';
import twilio from 'twilio';

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { phoneNumber } = JSON.parse(event.body || '{}');

    if (!phoneNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Phone number is required' })
      };
    }

    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_SERVICE_SID;

    if (!accountSid || !authToken || !serviceSid) {
      console.error('❌ Twilio credentials not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Twilio service not configured',
          details: 'Missing Twilio credentials in environment'
        })
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    console.log('📱 Sending OTP to:', phoneNumber);

    // Send verification code
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      });

    console.log('✅ OTP sent successfully');
    console.log('🆔 Verification SID:', verification.sid);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `SMS OTP sent to ${phoneNumber}. Please check your phone for the verification code.`,
        sid: verification.sid,
        status: verification.status
      })
    };
  } catch (error: any) {
    console.error('❌ Failed to send OTP:', error);

    // Handle specific Twilio errors
    if (error.code === 20003) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid phone number format',
          details: 'Please provide a valid phone number with country code (e.g., +91XXXXXXXXXX)'
        })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send OTP',
        details: error.message
      })
    };
  }
};

export { handler };
