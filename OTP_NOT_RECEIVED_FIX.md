# ❌ OTP Not Received - SOLUTION

## 🔍 What's Happening

The app is showing "OTP sent" but you're not receiving it because:

**The OTP server is NOT running!**

When the server is not running, the app falls back to **MOCK OTP** (development mode):
- It generates a fake OTP code
- Shows it in the browser console
- Does NOT send real SMS
- You won't receive anything on your phone

---

## ✅ How to Fix It

### Step 1: Open a NEW Terminal Window

**Important:** You need TWO terminal windows:
1. One for the OTP server
2. One for the Vite app

### Step 2: Start the OTP Server

In the **FIRST terminal window**, run:

```bash
cd server
npm install
npm start
```

You should see:
```
✅ Twilio configuration loaded successfully
📱 Ready to send real SMS via Twilio Verify
🚀 Server listening on port 4000
```

### Step 3: Start the Vite App

In the **SECOND terminal window**, run:

```bash
npm run dev
```

Or use the auto-start script:

```bash
npm start
```

---

## 🎯 Verify Server is Running

### Check 1: Browser Console
When you open the app, check the browser console (F12):

**If server is NOT running:**
```
❌ Server health check failed
⚠️  Server not available - will use DEVELOPMENT MODE
🔄 DEVELOPMENT MODE: Using mock OTP for testing
```

**If server IS running:**
```
✅ Real Twilio server confirmed - ready to send SMS
📱 Sending REAL SMS OTP to: +91XXXXXXXXXX
✅ Real SMS OTP sent successfully!
```

### Check 2: Server Console
Look at the server terminal window:

**If Twilio is configured:**
```
✅ Twilio configuration loaded successfully
📱 Ready to send real SMS via Twilio Verify
```

**If Twilio is NOT configured:**
```
❌ Twilio configuration missing:
TWILIO_ACCOUNT_SID or VITE_TWILIO_ACCOUNT_SID: ❌ Missing
TWILIO_AUTH_TOKEN or VITE_TWILIO_AUTH_TOKEN: ❌ Missing
TWILIO_SERVICE_SID or VITE_TWILIO_SERVICE_SID: ❌ Missing
```

### Check 3: Health Endpoint
Open in browser: `http://localhost:4000/health`

**If server is running:**
```json
{
  "status": "ok",
  "mode": "real",
  "twilio": {
    "accountSid": "ACxxxx...",
    "serviceSid": "VAxxxx...",
    "configured": true,
    "ready": true
  }
}
```

**If server is NOT running:**
```
Cannot GET /health
(or connection refused)
```

---

## 🚀 Complete Setup Steps

### 1. Verify Twilio Credentials
Check that `server/.env` has:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=4000
NODE_ENV=development
```

### 2. Terminal 1: Start OTP Server
```bash
cd server
npm install  # Only needed first time
npm start
```

Wait for:
```
✅ Twilio configuration loaded successfully
🚀 Server listening on port 4000
```

### 3. Terminal 2: Start Vite App
```bash
npm run dev
```

Or use auto-start (starts both automatically):
```bash
npm start
```

### 4. Test OTP
1. Open http://localhost:5173
2. Click "Phone" tab
3. Enter phone: `+91XXXXXXXXXX`
4. Click "Send OTP"
5. **Check phone for SMS (10-15 seconds)** ✅

---

## 🔧 Troubleshooting

### Problem: Server won't start
**Error:** `Cannot find module 'express'` or similar

**Solution:**
```bash
cd server
npm install
npm start
```

### Problem: Twilio credentials error
**Error:** `Twilio configuration missing`

**Solution:**
1. Go to https://console.twilio.com/
2. Get your credentials
3. Update `server/.env`
4. Restart server

### Problem: Port 4000 already in use
**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Kill process on port 4000
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:4000 | xargs kill -9
```

### Problem: Still getting mock OTP
**Check:**
1. Is server running? (Check terminal 1)
2. Is Twilio configured? (Check server/.env)
3. Is server healthy? (Check http://localhost:4000/health)
4. Refresh browser (Ctrl+Shift+R)

---

## 📋 Quick Checklist

- [ ] `server/.env` has all 3 Twilio credentials
- [ ] Terminal 1: `cd server && npm start` (server running)
- [ ] Terminal 2: `npm run dev` (app running)
- [ ] Browser console shows: "✅ Real Twilio server confirmed"
- [ ] Server console shows: "🚀 Server listening on port 4000"
- [ ] Phone number has country code: `+91XXXXXXXXXX`
- [ ] SMS arrives on phone in 10-15 seconds

---

## ✨ Summary

**The issue:** Server not running → Mock OTP → No real SMS

**The fix:** 
1. Start server in Terminal 1: `cd server && npm start`
2. Start app in Terminal 2: `npm run dev`
3. Test OTP → SMS arrives in 10-15 seconds ✅

---

**Once server is running, real SMS will work perfectly!**
