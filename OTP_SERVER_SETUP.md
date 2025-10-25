# 🚀 OTP Server Setup Guide - CRITICAL FOR PHONE LOGIN

## ⚠️ IMPORTANT: The OTP Server MUST Be Running

The error you're seeing (`ERR_CONNECTION_REFUSED` on `localhost:4000/health`) means **the OTP server is not running**.

Phone login requires a backend server to send real SMS OTPs via Twilio. Without it, phone login will NOT work.

---

## 📋 Step-by-Step Setup

### Step 1: Get Twilio Credentials

1. Go to https://console.twilio.com/
2. Sign up or log in to your Twilio account
3. Find these credentials in your console:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (long string)
   - **Verify Service SID** (starts with `VA...`)

### Step 2: Create Server .env File

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   # Windows (PowerShell)
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

3. Edit the `.env` file and fill in your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_SERVICE_SID=your_verify_service_sid_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   PORT=4000
   NODE_ENV=development
   ```

### Step 3: Install Server Dependencies

```bash
cd server
npm install
```

### Step 4: Start the OTP Server

**IMPORTANT: Run this in a SEPARATE terminal window**

```bash
cd server
npm start
```

You should see output like:
```
🚀 Starting REAL SMS OTP Service...
✅ Twilio configuration validated
📱 Account SID: AC1234...
🔧 Service SID: VA5678...
🎯 Starting REAL Twilio SMS server...
📱 Real SMS will be sent to phone numbers
🚫 No mock/fake OTPs will be used
```

### Step 5: Test Phone Login

1. Keep the server running in one terminal
2. In another terminal, run the app:
   ```bash
   npm run dev
   ```
3. Go to the login page
4. Click "Phone" tab
5. Enter your phone number (with country code, e.g., +919876543210)
6. Click "Send Code"
7. You should receive an SMS with the OTP code

---

## 🔧 Troubleshooting

### Error: "Server not responding"

**Solution:** Make sure the server is running:
```bash
cd server
npm start
```

### Error: "Twilio is not properly configured"

**Solution:** Check your `.env` file has all three credentials:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_SERVICE_SID

### Error: "Failed to fetch"

**Solution:** 
1. Check the server is running on port 4000
2. Check firewall isn't blocking port 4000
3. Try accessing http://localhost:4000/health in your browser

### Not receiving SMS

**Possible causes:**
1. Phone number format is wrong (needs country code like +91)
2. Twilio account doesn't have enough credits
3. Twilio Service SID is incorrect
4. Phone number is on Twilio's blocklist

---

## 📱 Testing with Demo Credentials

For testing WITHOUT real SMS, you can use email/password login:

- **Email:** `demo@timebank.com`
- **Password:** `demo123`

Or:

- **Email:** `official@timebank.com`
- **Password:** `official123`

---

## 🚀 Production Deployment

When deploying to Netlify:

1. Add environment variables in Netlify dashboard:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_SERVICE_SID`

2. Create Netlify Functions for OTP endpoints (optional, or use external server)

3. Update `VITE_SERVER_URL` in `.env.local` to point to your production server

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start OTP Server | `cd server && npm start` |
| Install dependencies | `cd server && npm install` |
| Run app | `npm run dev` |
| Check server health | Visit `http://localhost:4000/health` |

---

## ✅ Verification Checklist

- [ ] Twilio account created and credentials obtained
- [ ] `.env` file created in `server` directory
- [ ] All three Twilio credentials filled in `.env`
- [ ] `npm install` run in server directory
- [ ] Server started with `npm start`
- [ ] Server shows "✅ Twilio configuration validated"
- [ ] App running with `npm run dev`
- [ ] Phone login attempted and SMS received

---

## 🆘 Still Having Issues?

Check the browser console (F12) for detailed error messages. The error messages now include step-by-step instructions on how to fix the problem.

Common errors:
- `ERR_CONNECTION_REFUSED` → Server not running
- `Failed to fetch` → Server not responding
- `Twilio not configured` → Missing credentials in `.env`
