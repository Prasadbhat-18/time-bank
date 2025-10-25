import { Handler } from '@netlify/functions';
import twilio from 'twilio';

const handler: Handler = async (event) => {
  console.log('📱 [send-otp] Request received');
  console.log('Method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { phoneNumber } = JSON.parse(event.body || '{}');
    console.log('📞 Phone number:', phoneNumber);

    if (!phoneNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Phone number is required' })
      };
    }

    // Get Twilio credentials from environment variables
    // Support both TWILIO_ and VITE_TWILIO_ prefixes
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_SERVICE_SID || process.env.VITE_TWILIO_SERVICE_SID;

    console.log('🔍 Checking Twilio credentials:');
    console.log('  TWILIO_ACCOUNT_SID:', accountSid ? '✅ SET' : '❌ NOT SET');
    console.log('  TWILIO_AUTH_TOKEN:', authToken ? '✅ SET' : '❌ NOT SET');
    console.log('  TWILIO_SERVICE_SID:', serviceSid ? '✅ SET' : '❌ NOT SET');
    console.log('  VITE_TWILIO_ACCOUNT_SID:', process.env.VITE_TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ NOT SET');
    console.log('  VITE_TWILIO_AUTH_TOKEN:', process.env.VITE_TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET');
    console.log('  VITE_TWILIO_SERVICE_SID:', process.env.VITE_TWILIO_SERVICE_SID ? '✅ SET' : '❌ NOT SET');
    
    // List all TWILIO env vars
    const twilioVars = Object.keys(process.env).filter(k => k.includes('TWILIO'));
    console.log('📋 All TWILIO env vars:', twilioVars);

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
          },
          found: {
            accountSid: !!accountSid,
            authToken: !!authToken,
            serviceSid: !!serviceSid
          },
          allVars: twilioVars
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
