# 📱 OTP NOT WORKING - COMPLETE FIX

## Problem
OTP shows "sent" on login page but SMS is not arriving on your device.

## Root Cause
**OTP Server is not running!** The app shows "OTP sent" but there's no backend server to actually send the SMS via Twilio.

---

## Solution: Start OTP Server

### Step 1: Check Twilio Credentials

Verify you have Twilio credentials in `server/.env`:

```bash
# File: server/.env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=4000
NODE_ENV=development
```

**Don't have credentials?**
1. Go to https://www.twilio.com/console
2. Get Account SID and Auth Token
3. Create a Verify Service and get Service SID
4. Add to `server/.env`

### Step 2: Start OTP Server (Separate Terminal)

**Option A: Using Node directly**
```bash
cd server
npm install
node server.js
```

**Option B: Using startup script**
```bash
node start-otp-server.js
```

**Option C: Using npm script**
```bash
npm run server:start
```

### Step 3: Verify Server is Running

You should see:
```
✅ Twilio configuration loaded successfully
📱 Ready to send real SMS via Twilio Verify
Server listening on port 4000
```

### Step 4: Start App (Different Terminal)

```bash
npm start
# or
npm run dev
```

### Step 5: Test OTP

1. Go to login page
2. Click "Phone" tab
3. Enter your phone number (e.g., +91XXXXXXXXXX)
4. Click "Send OTP"
5. ✅ SMS should arrive in 10-15 seconds!

---

## Two Terminals Required

**Terminal 1 - OTP Server:**
```bash
cd c:\Users\prasa\Downloads\t1\time-bank\server
node server.js
```

**Terminal 2 - App:**
```bash
cd c:\Users\prasa\Downloads\t1\time-bank
npm run dev
```

Both must be running for OTP to work!

---

## Troubleshooting

### OTP Still Not Coming?

**Check 1: Server Running?**
- Terminal 1 should show: "Server listening on port 4000"
- If not, server is not running

**Check 2: Twilio Credentials?**
- Check `server/.env` has all 3 credentials
- Verify credentials are correct in Twilio console
- Restart server after changing credentials

**Check 3: Phone Number Format?**
- Must include country code: +91XXXXXXXXXX (India)
- Or +1XXXXXXXXXX (USA)
- Or appropriate code for your country

**Check 4: Server Console Errors?**
- Check Terminal 1 for error messages
- Look for: "❌ Twilio configuration missing"
- If missing, add credentials to `server/.env`

**Check 5: App Console Errors?**
- Open DevTools (F12) → Console
- Look for error messages
- Check for: "Failed to send OTP"

### Error: "Twilio configuration missing"

**Solution:**
1. Create `server/.env` file
2. Add Twilio credentials
3. Restart server: `node server.js`

### Error: "Cannot find module 'twilio'"

**Solution:**
```bash
cd server
npm install
node server.js
```

### Error: "Port 4000 already in use"

**Solution:**
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
PORT=4001 node server.js
```

---

## Complete Setup Checklist

- [ ] Twilio account created
- [ ] Verify Service created in Twilio
- [ ] `server/.env` file created
- [ ] TWILIO_ACCOUNT_SID added
- [ ] TWILIO_AUTH_TOKEN added
- [ ] TWILIO_SERVICE_SID added
- [ ] Server dependencies installed: `cd server && npm install`
- [ ] OTP Server running: `node server.js`
- [ ] App running: `npm run dev`
- [ ] Phone number format correct (+91XXXXXXXXXX)
- [ ] SMS received on phone

---

## How OTP Works

```
User enters phone number
        ↓
Clicks "Send OTP"
        ↓
App sends request to OTP Server (localhost:4000)
        ↓
Server validates Twilio credentials
        ↓
Server calls Twilio API
        ↓
Twilio sends SMS to phone
        ↓
User receives SMS in 10-15 seconds ✅
        ↓
User enters code
        ↓
App verifies code with server
        ↓
User logged in ✅
```

---

## Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/api/send-otp` | POST | Send OTP to phone |
| `/api/verify-otp` | POST | Verify OTP code |
| `/api/send-distress` | POST | Send distress signal |

---

## Testing OTP Manually

### Using curl (Command Line)

```bash
# Send OTP
curl -X POST http://localhost:4000/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+91XXXXXXXXXX"}'

# Verify OTP
curl -X POST http://localhost:4000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+91XXXXXXXXXX","code":"123456"}'
```

### Using Postman

1. Create POST request to `http://localhost:4000/api/send-otp`
2. Body (JSON):
   ```json
   {
     "phoneNumber": "+91XXXXXXXXXX"
   }
   ```
3. Send
4. Check phone for SMS

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "OTP sent" but no SMS | Server not running | Start server: `node server.js` |
| "Cannot connect to server" | Server not running on port 4000 | Check Terminal 1 |
| "Twilio configuration missing" | Missing .env credentials | Add to `server/.env` |
| "Invalid phone number" | Wrong format | Use +91XXXXXXXXXX |
| "Permission denied" | Twilio credentials wrong | Verify in Twilio console |
| "Port 4000 in use" | Another process using port | Kill process or use different port |

---

## Quick Start (Copy-Paste)

### Terminal 1 (OTP Server):
```bash
cd c:\Users\prasa\Downloads\t1\time-bank\server
npm install
node server.js
```

### Terminal 2 (App):
```bash
cd c:\Users\prasa\Downloads\t1\time-bank
npm run dev
```

### Then:
1. Go to http://localhost:5173
2. Click "Phone" tab
3. Enter phone: +91XXXXXXXXXX
4. Click "Send OTP"
5. ✅ SMS arrives in 10-15 seconds!

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/server.js` | Main OTP server |
| `server/.env` | Twilio credentials |
| `start-otp-server.js` | Startup script |
| `src/services/twilioService.ts` | Client-side OTP service |

---

## Next Steps

1. ✅ Create `server/.env` with Twilio credentials
2. ✅ Install server dependencies: `cd server && npm install`
3. ✅ Start OTP server: `node server.js`
4. ✅ Start app: `npm run dev`
5. ✅ Test OTP on phone login
6. ✅ SMS should arrive in 10-15 seconds!

---

## Support

If OTP still not working:

1. **Check server is running** (Terminal 1 should show "Server listening on port 4000")
2. **Check Twilio credentials** in `server/.env`
3. **Check phone number format** (+91XXXXXXXXXX)
4. **Check server console** for error messages
5. **Check app console** (F12) for error messages
6. **Verify Twilio account** is active and has credits

---

**Status**: 🔧 OTP Setup Complete

**Next**: Start the OTP server and test!
