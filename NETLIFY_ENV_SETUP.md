# 🔧 Netlify Environment Variables Setup Guide

## Complete .env Configuration for All Functions

---

## 📋 What Goes in Netlify Environment Variables

In Netlify Site Settings → Environment Variables, add these exact variables:

---

## 🔐 Firebase Configuration (REQUIRED)

These are **ESSENTIAL** for the app to work. Get them from Firebase Console.

### Step 1: Get Firebase Credentials
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click ⚙️ Settings → Project Settings
4. Scroll to "Your apps" section
5. Find your web app configuration
6. Copy the values

### Step 2: Add to Netlify

```
VITE_FIREBASE_API_KEY = your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
```

### Example:
```
VITE_FIREBASE_API_KEY = AIzaSyDxxx...
VITE_FIREBASE_AUTH_DOMAIN = timebank-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = timebank-demo
VITE_FIREBASE_STORAGE_BUCKET = timebank-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID = 1:123456789:web:abc123def456
```

---

## 🤖 Groq API Key (OPTIONAL - For AI Chat)

If you want AI-enhanced chat messages:

### Step 1: Get Groq API Key
1. Go to https://console.groq.com/
2. Sign up or log in
3. Create API key
4. Copy the key

### Step 2: Add to Netlify

```
VITE_GROQ_API_KEY = your_groq_api_key
```

### Example:
```
VITE_GROQ_API_KEY = gsk_xxxxxxxxxxxxx
```

### Note:
- ✅ Chat works WITHOUT this key
- ✅ Optional for AI enhancement
- ✅ Leave empty if not using AI

---

## 📱 OTP/SMS Configuration (OPTIONAL - For Real SMS)

If you want real SMS OTP delivery:

### Step 1: Get Twilio Credentials
1. Go to https://www.twilio.com/console
2. Sign up or log in
3. Get Account SID and Auth Token
4. Get a Twilio phone number

### Step 2: Configure Server

**Note:** These go in `server/.env`, NOT Netlify

```
TWILIO_ACCOUNT_SID = your_account_sid
TWILIO_AUTH_TOKEN = your_auth_token
TWILIO_PHONE_NUMBER = +1234567890
```

### Note:
- ✅ OTP works WITHOUT Twilio (mock mode)
- ✅ Real SMS requires server running
- ✅ Deploy server separately (Heroku, Railway, etc.)

---

## 🌐 Server URL (OPTIONAL)

If you deploy backend server separately:

```
VITE_SERVER_URL = https://your-server.herokuapp.com
```

### Default:
- Leave empty for `http://localhost:4000` (development)
- Set for production server URL

---

## ✅ Complete Netlify Environment Setup

### Minimal Setup (All Functions Work)
```
VITE_FIREBASE_API_KEY = your_value
VITE_FIREBASE_AUTH_DOMAIN = your_value
VITE_FIREBASE_PROJECT_ID = your_value
VITE_FIREBASE_STORAGE_BUCKET = your_value
VITE_FIREBASE_MESSAGING_SENDER_ID = your_value
VITE_FIREBASE_APP_ID = your_value
```

### Full Setup (All Features)
```
VITE_FIREBASE_API_KEY = your_value
VITE_FIREBASE_AUTH_DOMAIN = your_value
VITE_FIREBASE_PROJECT_ID = your_value
VITE_FIREBASE_STORAGE_BUCKET = your_value
VITE_FIREBASE_MESSAGING_SENDER_ID = your_value
VITE_FIREBASE_APP_ID = your_value
VITE_GROQ_API_KEY = your_value
VITE_SERVER_URL = https://your-server.herokuapp.com
```

---

## 🎯 What Each Variable Does

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| VITE_FIREBASE_API_KEY | Firebase authentication | ✅ YES | AIzaSy... |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase domain | ✅ YES | project.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | Firebase project ID | ✅ YES | my-project |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase storage | ✅ YES | project.appspot.com |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase messaging | ✅ YES | 123456789 |
| VITE_FIREBASE_APP_ID | Firebase app ID | ✅ YES | 1:123:web:abc |
| VITE_GROQ_API_KEY | AI chat enhancement | ❌ NO | gsk_xxx |
| VITE_SERVER_URL | Backend server URL | ❌ NO | https://... |

---

## 🚀 How to Add to Netlify

### Step 1: Go to Netlify Dashboard
1. Go to https://app.netlify.com/
2. Select your site
3. Click "Site Settings"

### Step 2: Navigate to Environment
1. Click "Build & Deploy"
2. Click "Environment"
3. Click "Edit Variables"

### Step 3: Add Variables
1. Click "Add a variable"
2. Enter Key: `VITE_FIREBASE_API_KEY`
3. Enter Value: `your_actual_value`
4. Click "Save"
5. Repeat for each variable

### Step 4: Redeploy
1. Go to "Deployments"
2. Click "Trigger Deploy"
3. Select "Deploy site"
4. Wait for build to complete

---

## ✨ What Works With Each Setup

### Setup 1: Firebase Only (Minimal)
```
✅ Google Login
✅ Phone Login (mock OTP)
✅ Email Registration
✅ Service Marketplace
✅ Booking System
✅ Reviews & Ratings
✅ XP & Levels
✅ Emergency Contacts
✅ SOS Button (demo mode)
✅ Chat (no AI)
✅ Dark Mode
✅ Mobile Responsive
```

### Setup 2: Firebase + Groq (AI Chat)
```
✅ Everything above +
✅ AI-enhanced chat messages
✅ Smart suggestions
✅ Auto-complete responses
```

### Setup 3: Firebase + Server (Real SMS)
```
✅ Everything above +
✅ Real SMS OTP
✅ Real SOS distress messages
✅ Location sharing via SMS
```

### Setup 4: Complete (Firebase + Groq + Server)
```
✅ ALL FEATURES
✅ Everything working perfectly
```

---

## 🔍 How to Find Your Firebase Values

### Firebase Console Steps:

1. **Go to Firebase Console**
   - https://console.firebase.google.com/

2. **Select Your Project**
   - Click on your project name

3. **Go to Project Settings**
   - Click ⚙️ (gear icon) → Project Settings

4. **Find Web App Config**
   - Scroll down to "Your apps"
   - Find your web app
   - Click the config button
   - You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxx...",
  authDomain: "timebank-demo.firebaseapp.com",
  projectId: "timebank-demo",
  storageBucket: "timebank-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

5. **Map to Environment Variables**
   - apiKey → VITE_FIREBASE_API_KEY
   - authDomain → VITE_FIREBASE_AUTH_DOMAIN
   - projectId → VITE_FIREBASE_PROJECT_ID
   - storageBucket → VITE_FIREBASE_STORAGE_BUCKET
   - messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID
   - appId → VITE_FIREBASE_APP_ID

---

## 🔍 How to Find Your Groq API Key

1. Go to https://console.groq.com/
2. Sign in or create account
3. Click "API Keys" in sidebar
4. Click "Create New API Key"
5. Copy the key
6. Add to Netlify as `VITE_GROQ_API_KEY`

---

## 🔍 How to Find Your Twilio Credentials

1. Go to https://www.twilio.com/console
2. Sign in
3. Find "Account SID" and "Auth Token"
4. Get a Twilio phone number
5. Add to `server/.env` (NOT Netlify)

---

## ⚠️ Important Notes

### Security
- ✅ Never commit `.env` files to git
- ✅ Use Netlify environment variables
- ✅ Keep API keys secret
- ✅ Rotate keys regularly

### Firebase
- ✅ Enable Authentication methods in Firebase Console
- ✅ Enable Firestore Database
- ✅ Set proper security rules

### Deployment
- ✅ Deploy frontend to Netlify
- ✅ Deploy backend to Heroku/Railway (if using)
- ✅ Update VITE_SERVER_URL if needed

---

## 🧪 Testing Your Setup

### After Adding Environment Variables:

1. **Trigger Redeploy**
   - Go to Netlify Deployments
   - Click "Trigger Deploy"

2. **Wait for Build**
   - Check build logs
   - Should complete without errors

3. **Test Features**
   - Google Login ✅
   - Phone Login ✅
   - Email Registration ✅
   - Browse Services ✅
   - Create Booking ✅
   - Chat ✅
   - SOS Button ✅

4. **Check Console**
   - Open browser DevTools (F12)
   - Check Console tab
   - Should see no errors

---

## 🐛 Troubleshooting

### Issue: "Firebase not initialized"
**Solution:** Check all 6 Firebase variables are set correctly

### Issue: "Chat not working"
**Solution:** 
- Chat works without Groq key
- If you want AI, add VITE_GROQ_API_KEY

### Issue: "SOS showing demo mode"
**Solution:**
- Deploy backend server
- Add VITE_SERVER_URL to Netlify
- Ensure Twilio credentials in server/.env

### Issue: "Build fails"
**Solution:**
- Check environment variable names (case-sensitive)
- Verify no extra spaces
- Redeploy after fixing

---

## ✅ Verification Checklist

Before deploying:
- [ ] All 6 Firebase variables added
- [ ] No typos in variable names
- [ ] Values copied correctly
- [ ] Netlify redeploy triggered
- [ ] Build completed successfully
- [ ] Features tested on live site

---

## 📱 Local Development Setup

For testing locally, create `.env.local` in project root:

```
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value
VITE_GROQ_API_KEY=your_value (optional)
VITE_SERVER_URL=http://localhost:4000 (optional)
```

Then run:
```bash
npm run dev
```

---

## 🎯 Quick Summary

### Minimum for Netlify (All Functions Work)
```
1. VITE_FIREBASE_API_KEY
2. VITE_FIREBASE_AUTH_DOMAIN
3. VITE_FIREBASE_PROJECT_ID
4. VITE_FIREBASE_STORAGE_BUCKET
5. VITE_FIREBASE_MESSAGING_SENDER_ID
6. VITE_FIREBASE_APP_ID
```

### Optional Additions
```
7. VITE_GROQ_API_KEY (for AI chat)
8. VITE_SERVER_URL (for real SMS)
```

---

## 🚀 You're Ready!

Once you add these environment variables to Netlify, your TimeBank app will be fully functional with:
- ✅ All authentication methods
- ✅ Service marketplace
- ✅ Booking system
- ✅ Reviews & ratings
- ✅ XP & levels
- ✅ Emergency contacts
- ✅ Chat (with optional AI)
- ✅ Dark mode
- ✅ Mobile responsive

**Happy deploying!** 🎉
