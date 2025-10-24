# Netlify OTP Deployment Guide

## Overview
The app now uses **Netlify Serverless Functions** for OTP delivery on production. This eliminates the need for a separate backend server.

## What Changed

### 1. **Netlify Functions Created**
- `netlify/functions/send-otp.ts` - Sends OTP via Twilio
- `netlify/functions/verify-otp.ts` - Verifies OTP codes
- `netlify/functions/health.ts` - Health check endpoint

### 2. **Updated twilioService.ts**
- Auto-detects if running on Netlify vs localhost
- Routes to serverless functions on production
- Routes to local server on development

### 3. **Configuration Files**
- `netlify.toml` - Netlify build and function configuration

## Deployment Steps

### Step 1: Add Environment Variables to Netlify

Go to your Netlify site dashboard:
1. **Site Settings** → **Build & Deploy** → **Environment**
2. Add these variables:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SERVICE_SID=your_service_sid
```

### Step 2: Push to Git

```bash
git add .
git commit -m "Add Netlify serverless functions for OTP"
git push origin main
```

### Step 3: Netlify Auto-Deploy

Netlify will automatically:
1. Build the app (`npm run build`)
2. Deploy serverless functions from `netlify/functions/`
3. Deploy the React app to `dist/`

## Local Development

### Option 1: Using Local Server (Recommended for Testing)

```bash
# Terminal 1: Start the backend server
cd server
npm start

# Terminal 2: Start the React app
npm run dev
```

The app will automatically detect localhost and use the local server.

### Option 2: Using Netlify Dev

```bash
npm install -g netlify-cli
netlify dev
```

This simulates the production environment locally.

## Troubleshooting

### OTP Not Sending?

1. **Check Netlify Environment Variables**
   - Verify all three Twilio variables are set in Netlify dashboard
   - Redeploy after adding/updating variables

2. **Check Browser Console**
   - Look for "📍 Send OTP endpoint:" log
   - Should show `/.netlify/functions/send-otp` on production
   - Should show `http://localhost:4000/api/send-otp` on localhost

3. **Check Netlify Function Logs**
   - Go to Netlify Dashboard → Functions → Logs
   - Look for errors in send-otp function

4. **Verify Twilio Credentials**
   - Make sure Account SID, Auth Token, and Service SID are correct
   - Test credentials in Twilio console

### Connection Refused Error?

This means the app is trying to connect to the wrong endpoint:
- On production: Should use `/.netlify/functions/send-otp`
- On localhost: Should use `http://localhost:4000/api/send-otp`

Check the browser console logs to see which endpoint is being used.

## Testing

### Test OTP on Production

1. Go to your deployed website
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try phone login
5. Look for logs like:
   - `📍 Send OTP endpoint: /.netlify/functions/send-otp`
   - `✅ OTP sent successfully!`

### Test OTP Locally

1. Start backend: `cd server && npm start`
2. Start frontend: `npm run dev`
3. Open browser DevTools
4. Try phone login
5. Look for logs like:
   - `📍 Send OTP endpoint: http://localhost:4000/api/send-otp`
   - `✅ OTP sent successfully!`

## Files Modified

- ✅ `src/services/twilioService.ts` - Updated to use Netlify functions
- ✅ `netlify/functions/send-otp.ts` - New serverless function
- ✅ `netlify/functions/verify-otp.ts` - New serverless function
- ✅ `netlify/functions/health.ts` - New health check function
- ✅ `netlify.toml` - New Netlify configuration

## Architecture

```
Production (Netlify):
  React App → /.netlify/functions/send-otp → Twilio API → SMS

Development (Localhost):
  React App → http://localhost:4000/api/send-otp → Twilio API → SMS
```

## Next Steps

1. ✅ Commit and push changes
2. ✅ Verify environment variables in Netlify
3. ✅ Test OTP on production website
4. ✅ Monitor Netlify function logs for errors
