import { Handler } from '@netlify/functions';
import twilio from 'twilio';

const handler: Handler = async (event) => {
  console.log('🔐 [verify-otp] Request received');
  console.log('Method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { phoneNumber, otp } = JSON.parse(event.body || '{}');
    console.log('📞 Phone:', phoneNumber, 'OTP:', otp);

    if (!phoneNumber || !otp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Phone number and OTP are required' })
      };
    }

    // Get Twilio credentials from environment variables
    // Support both TWILIO_ and VITE_TWILIO_ prefixes
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_SERVICE_SID || process.env.VITE_TWILIO_SERVICE_SID;

    console.log('🔍 Checking Twilio credentials:');
    console.log('  accountSid:', accountSid ? '✅ SET' : '❌ NOT SET');
    console.log('  authToken:', authToken ? '✅ SET' : '❌ NOT SET');
    console.log('  serviceSid:', serviceSid ? '✅ SET' : '❌ NOT SET');

    if (!accountSid || !authToken || !serviceSid) {
      console.error('❌ Twilio credentials not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Twilio service not configured',
          details: 'Missing Twilio credentials. Set these in Netlify Site Settings > Build & Deploy > Environment Variables',
          required: {
            VITE_TWILIO_ACCOUNT_SID: 'your_account_sid',
            VITE_TWILIO_AUTH_TOKEN: 'your_auth_token',
            VITE_TWILIO_SERVICE_SID: 'your_service_sid'
          }
        })
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    console.log('🔐 Verifying OTP for:', phoneNumber);

    // Verify the code
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp
      });

    console.log('✅ OTP verification result:', verificationCheck.status);

    if (verificationCheck.status === 'approved') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'OTP verified successfully',
          valid: true,
          status: 'approved'
        })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid OTP',
          valid: false,
          status: verificationCheck.status
        })
      };
    }
  } catch (error: any) {
    console.error('❌ Failed to verify OTP:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to verify OTP',
        details: error.message
      })
    };
  }
};

export { handler };
