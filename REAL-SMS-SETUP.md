# 📱 Real SMS OTP Setup Guide

This guide ensures you're sending **REAL SMS** messages, not mock/fake OTPs.

## 🚨 IMPORTANT: Only Real SMS Will Be Sent

The system has been configured to **ONLY** send real SMS messages through Twilio. All mock/fake OTP services have been disabled.

## 🔧 Setup Steps

### 1. Configure Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Get your credentials:
   - **Account SID** (starts with AC...)
   - **Auth Token** (secret key)
   - **Verify Service SID** (starts with VA...)

3. Create `.env` file in the `server/` directory:
```bash
cd server
cp .env.example .env
```

4. Edit `.env` file with your real Twilio credentials:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=4000
```

### 2. Start the Real SMS Server

**ALWAYS use this command to start the server:**
```bash
cd server
npm start
```

This will:
- ✅ Validate your Twilio configuration
- ✅ Ensure real SMS service is running
- ✅ Disable any mock servers
- ✅ Send real SMS to phone numbers

### 3. Verify Real SMS is Working

When you start the server, you should see:
```
🚀 Starting REAL SMS OTP Service...
✅ Twilio configuration validated
📱 Account SID: ACxxxx...
🔧 Service SID: VAxxxx...
🎯 Starting REAL Twilio SMS server...
📱 Real SMS will be sent to phone numbers
🚫 No mock/fake OTPs will be used
```

## 🚫 What's Been Disabled

- ❌ Mock server (`mock-server.js` renamed to `.disabled`)
- ❌ Client-side Twilio service (deprecated)
- ❌ Any fallback to fake OTPs

## 🔍 Troubleshooting

### Problem: "Mock server detected!"
**Solution:** Make sure you're running `npm start` in the `server/` directory, not `mock-server.js`

### Problem: "Twilio not configured"
**Solution:** Check your `.env` file has valid Twilio credentials

### Problem: "Server is not responding"
**Solution:** Make sure the server is running on port 4000

### Problem: SMS not received
**Solutions:**
1. Check phone number format (include country code: +1234567890)
2. Verify Twilio account has SMS credits
3. Check Twilio console for delivery status
4. Ensure phone number is verified in Twilio (for trial accounts)

## 📱 Phone Number Format

Always use international format:
- ✅ `+1234567890` (US)
- ✅ `+919876543210` (India)
- ❌ `1234567890` (missing +)
- ❌ `(123) 456-7890` (formatted)

## 🎯 Testing

1. Start the server: `cd server && npm start`
2. Open your app
3. Try phone login/registration
4. Check server logs for "Real SMS OTP sent successfully"
5. Check your phone for the SMS

## 🔒 Security Notes

- Never commit your `.env` file to git
- Keep your Twilio credentials secure
- Use Twilio Verify service (not Programmable SMS) for OTP
- Real SMS costs money - monitor your Twilio usage

## ✅ Success Indicators

You'll know it's working when:
- Server logs show "Real SMS OTP sent successfully"
- You receive actual SMS on your phone
- No "mock" or "fake" messages in logs
- Twilio console shows SMS delivery

---

**Remember: This system ONLY sends real SMS. No mock/fake OTPs will be used!**
