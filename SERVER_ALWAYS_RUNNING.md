# 🚀 SERVER ALWAYS RUNNING - PRODUCTION SETUP

## Problem
OTP sometimes doesn't come on Netlify deployed website because the server is not always running.

## Solution
Keep the OTP server running 24/7 with automatic restart and health checks.

---

## Option 1: Local Development (Keep Server Running)

### Start Server with Keep-Alive

```bash
npm run server:keep-alive
```

**Features:**
- ✅ Auto-starts OTP server
- ✅ Health checks every 30 seconds
- ✅ Auto-restarts if server crashes
- ✅ Logs all activity
- ✅ Graceful shutdown with Ctrl+C

**Output:**
```
🚀 Starting Server Keep-Alive Monitor...

📊 Configuration:
   Server Port: 4000
   Health Check Interval: 30s
   Max Restart Attempts: 5
   Restart Delay: 5s

✅ Server Keep-Alive Monitor is ACTIVE

Server will:
  ✅ Start automatically
  ✅ Health check every 30 seconds
  ✅ Auto-restart if it crashes
  ✅ Log all activity
```

### Simple Server Start

```bash
npm run server
```

**Or manually:**
```bash
cd server
node server.js
```

---

## Option 2: Netlify Deployment (Always Running)

### Problem with Netlify
Netlify Functions are **serverless** - they only run when called. They don't stay running 24/7.

### Solution: Use External OTP Service

**Option A: Twilio Verify API (Recommended)**
- Twilio handles OTP delivery directly
- No need for your own server
- Always available, 99.9% uptime

**Option B: Use Heroku/Railway for Server**
- Deploy OTP server to Heroku or Railway
- Server runs 24/7
- App calls your server from Netlify

**Option C: Use AWS Lambda + RDS**
- Serverless OTP backend
- Always available
- Scales automatically

---

## Option 3: Heroku Deployment (Free Alternative)

### Deploy OTP Server to Heroku

**Step 1: Create Heroku Account**
- Go to https://www.heroku.com/
- Sign up for free account

**Step 2: Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

**Step 3: Create Heroku App**
```bash
heroku login
heroku create your-app-name-otp
```

**Step 4: Add Twilio Credentials**
```bash
heroku config:set TWILIO_ACCOUNT_SID=your_account_sid
heroku config:set TWILIO_AUTH_TOKEN=your_auth_token
heroku config:set TWILIO_SERVICE_SID=your_service_sid
heroku config:set PORT=5000
```

**Step 5: Deploy Server**
```bash
cd server
git init
git add .
git commit -m "Deploy OTP server"
git push heroku main
```

**Step 6: Update App to Use Heroku Server**

In `src/services/twilioService.ts`:
```typescript
// Change from localhost to Heroku
const API_BASE = 'https://your-app-name-otp.herokuapp.com';
```

**Step 7: Test**
- Go to your Netlify app
- Phone login → Send OTP
- ✅ SMS arrives from Heroku server!

---

## Option 4: Railway Deployment (Recommended)

### Deploy OTP Server to Railway

**Step 1: Create Railway Account**
- Go to https://railway.app/
- Sign up with GitHub

**Step 2: Create New Project**
- Click "New Project"
- Select "Deploy from GitHub"
- Select your TimeBank repo

**Step 3: Configure Server**
- Select `server` directory
- Add environment variables:
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_SERVICE_SID
  - PORT=5000

**Step 4: Deploy**
- Railway auto-deploys on push
- Server runs 24/7

**Step 5: Get Server URL**
- Go to Railway dashboard
- Copy your app URL (e.g., https://timebank-otp.railway.app)

**Step 6: Update App**

In `src/services/twilioService.ts`:
```typescript
const API_BASE = 'https://timebank-otp.railway.app';
```

**Step 7: Test**
- ✅ OTP works on Netlify!

---

## Option 5: AWS Lambda + API Gateway

### Serverless OTP Backend

**Step 1: Create Lambda Function**
- AWS Console → Lambda
- Create function from `server/server.js`
- Add Twilio credentials

**Step 2: Create API Gateway**
- API Gateway → Create REST API
- Create endpoints:
  - POST /send-otp
  - POST /verify-otp
  - GET /health

**Step 3: Connect to Lambda**
- Link API Gateway to Lambda function
- Deploy API

**Step 4: Update App**
```typescript
const API_BASE = 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';
```

**Step 5: Test**
- ✅ OTP works on Netlify!

---

## Recommended Setup

### For Development
```bash
npm run server:keep-alive
```
- Keeps server running locally
- Auto-restarts if crashes
- Perfect for testing

### For Production (Netlify)
**Use Railway or Heroku:**
1. Deploy OTP server to Railway/Heroku
2. Server runs 24/7
3. Update app to use server URL
4. OTP always works!

---

## Testing Server Uptime

### Check Server Status
```bash
curl https://your-server-url/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "mode": "real",
  "twilio": {
    "configured": true,
    "ready": true
  }
}
```

### Monitor Server Logs
- Heroku: `heroku logs --tail`
- Railway: Dashboard → Logs
- Local: Console output

---

## Troubleshooting

### OTP Still Not Working on Netlify?

**Check 1: Server Running?**
```bash
curl https://your-server-url/health
```
- Should return 200 OK
- If error, server not running

**Check 2: Credentials Set?**
- Heroku: `heroku config`
- Railway: Check environment variables
- Should show all 3 Twilio credentials

**Check 3: App Using Correct URL?**
- Check `src/services/twilioService.ts`
- Should use server URL, not localhost
- Restart app after changing

**Check 4: Twilio Account Active?**
- Go to Twilio Console
- Check account has credits
- Verify Service is active

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/server.js` | Main OTP server |
| `server/.env` | Twilio credentials |
| `server-keep-alive.js` | Keep-alive monitor |
| `src/services/twilioService.ts` | Client-side OTP service |
| `package.json` | npm scripts |

---

## npm Scripts

```bash
npm run server              # Start OTP server
npm run server:keep-alive   # Start with auto-restart
npm run dev                 # Start app (localhost)
npm start                   # Start both (if configured)
```

---

## Summary

### Local Development
```bash
npm run server:keep-alive
# Server runs with auto-restart
# Health checks every 30 seconds
```

### Production (Netlify)
```
Deploy OTP server to Railway/Heroku
↓
Server runs 24/7
↓
App calls server from Netlify
↓
OTP always works! ✅
```

---

## Next Steps

1. **For Local Testing:**
   ```bash
   npm run server:keep-alive
   ```

2. **For Production:**
   - Deploy server to Railway or Heroku
   - Update app to use server URL
   - Test OTP on Netlify

3. **Verify:**
   - Check server health: `curl https://your-server-url/health`
   - Test OTP: Phone login → Send OTP
   - SMS should arrive in 10-15 seconds

---

**Status**: ✅ Server Keep-Alive Setup Complete

**Next**: Choose deployment option and get OTP working 24/7!
