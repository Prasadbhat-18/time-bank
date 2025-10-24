import { Handler } from '@netlify/functions';

const handler: Handler = async () => {
  // Support both TWILIO_ and VITE_TWILIO_ prefixes
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_SERVICE_SID || process.env.VITE_TWILIO_SERVICE_SID;

  console.log('🔍 Health check - Environment variables:');
  console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'SET (' + accountSid.substring(0, 4) + '...)' : 'NOT SET');
  console.log('TWILIO_AUTH_TOKEN:', authToken ? 'SET (' + authToken.substring(0, 4) + '...)' : 'NOT SET');
  console.log('TWILIO_SERVICE_SID:', serviceSid ? 'SET (' + serviceSid.substring(0, 4) + '...)' : 'NOT SET');

  const isConfigured = !!(accountSid && authToken && serviceSid);

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'ok',
      mode: 'production',
      twilio: {
        configured: isConfigured,
        accountSid: accountSid ? accountSid.substring(0, 4) + '...' : 'not set',
        authToken: authToken ? authToken.substring(0, 4) + '...' : 'not set',
        serviceSid: serviceSid ? serviceSid.substring(0, 4) + '...' : 'not set'
      },
      debug: {
        allEnvVars: Object.keys(process.env).filter(k => k.includes('TWILIO'))
      }
    })
  };
};

export { handler };
