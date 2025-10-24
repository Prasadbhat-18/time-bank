import { Handler } from '@netlify/functions';

const handler: Handler = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const serviceSid = process.env.TWILIO_SERVICE_SID;

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'ok',
      mode: 'production',
      twilio: {
        configured: !!(accountSid && serviceSid),
        accountSid: accountSid ? accountSid.substring(0, 4) + '...' : 'not set',
        serviceSid: serviceSid ? serviceSid.substring(0, 4) + '...' : 'not set'
      }
    })
  };
};

export { handler };
