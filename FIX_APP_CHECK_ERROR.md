# 🔧 FIX: auth/firebase-app-check-token-is-invalid

## ❌ Error You're Seeing:
```
Firebase: Error (auth/firebase-app-check-token-is-invalid.)
```

## 🎯 Root Cause:
**Firebase App Check is enabled in your Firebase Console** but not configured in your app code.

App Check is a security feature that prevents abuse by verifying requests come from your legitimate app.

---

## ✅ SOLUTION 1: Disable App Check (Quick - 2 minutes)

**Best for development/testing. Recommended for now.**

### Step 1: Go to App Check Settings

Open this URL:
```
https://console.firebase.google.com/project/time-bank-91b48/appcheck
```

### Step 2: Disable Enforcement

1. You'll see sections for **Authentication**, **Firestore**, etc.
2. Find **"Authentication"** section
3. Click the **⋮** (three dots menu)
4. Click **"Turn off enforcement"**
5. Confirm

### Step 3: Repeat for Other Services

Do the same for:
- ✅ **Firestore** (if showing enforcement)
- ✅ **Cloud Storage** (if showing enforcement)
- ✅ Any other services showing enforcement

### Step 4: Test Login

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. Try email login again
3. **Should work now!** ✅

---

## ✅ SOLUTION 2: Configure App Check (Proper - 15 minutes)

**Best for production. More secure.**

### Step 1: Install App Check Package

```powershell
npm install firebase@latest
```

### Step 2: Register Your App for App Check

1. Go to: https://console.firebase.google.com/project/time-bank-91b48/appcheck
2. Click **"Get started"** or **"Add app"**
3. Select your **Web app**
4. Choose provider:
   - **reCAPTCHA v3** (recommended for web)
   - Or **reCAPTCHA Enterprise** (requires Google Cloud setup)

### Step 3: Get reCAPTCHA Site Key

If using reCAPTCHA v3:
1. Go to: https://www.google.com/recaptcha/admin
2. Register a new site:
   - **Label**: TimeBank App
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `localhost` (for development)
     - `time-bank-91b48.firebaseapp.com` (for production)
3. Accept terms → Submit
4. **Copy the Site Key** (starts with `6L...`)

### Step 4: Add Site Key to Firebase Console

1. Back in Firebase App Check settings
2. Paste your **reCAPTCHA site key**
3. Click **"Save"**

### Step 5: Configure App Check in Code

Update `src/firebase.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// ... existing firebaseConfig ...

// Only initialize Firebase if we have valid configuration
if (isFirebaseConfigured()) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
      
      // Initialize App Check
      if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        try {
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
          });
          console.log('✅ App Check initialized');
        } catch (error) {
          console.warn('⚠️ App Check initialization failed:', error);
        }
      } else {
        console.warn('⚠️ App Check not configured (missing VITE_RECAPTCHA_SITE_KEY)');
      }
    } else {
      app = getApps()[0];
      console.log('♻️ Reusing existing Firebase app instance');
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
    app = null;
    auth = null;
    db = null;
  }
}

export { auth, db, storage };
export default app;
```

### Step 6: Add reCAPTCHA Key to .env.local

Update `.env.local`:

```bash
# Existing Firebase config...
VITE_FIREBASE_API_KEY=AIzaSyAtO0AzKkZxVaFFYHlmOmb-kV4_VZJXLGU
VITE_FIREBASE_AUTH_DOMAIN=time-bank-91b48.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=time-bank-91b48
VITE_FIREBASE_STORAGE_BUCKET=time-bank-91b48.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1006497280677
VITE_FIREBASE_APP_ID=1:1006497280677:web:29114ba77863a3829ed34c

# Add this:
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 7: Restart Dev Server

```powershell
# Stop server (Ctrl+C)
npm run dev
```

### Step 8: Test

1. Hard refresh: `Ctrl + Shift + R`
2. Try login
3. Should work! ✅

---

## 📊 Comparison

| Solution | Speed | Security | Best For |
|----------|-------|----------|----------|
| **Solution 1** (Disable) | ⚡ 2 min | ⚠️ Lower | Development, Testing |
| **Solution 2** (Configure) | 🐢 15 min | ✅ High | Production |

---

## 🎯 **RECOMMENDED: Use Solution 1 Now**

**Why?**
- ✅ Quick fix (2 minutes)
- ✅ Get back to development
- ✅ Can enable App Check later when deploying to production

**Steps:**
1. Open: https://console.firebase.google.com/project/time-bank-91b48/appcheck
2. Turn off enforcement for Authentication
3. Turn off enforcement for Firestore
4. Refresh browser → Try login → Works! ✅

---

## 🔍 How to Know if App Check is Enabled

In Firebase Console → App Check:

**Enforcement is ON:**
```
🔴 Authentication - Enforced
🔴 Firestore - Enforced
```

**Enforcement is OFF:**
```
⚪ Authentication - Not enforced
⚪ Firestore - Not enforced
```

You want: **⚪ Not enforced** (for development)

---

## ⚠️ Important Notes

### App Check Enforcement Levels:

1. **Off** (Not enforced)
   - Allows requests without App Check tokens
   - Good for development
   - Less secure

2. **Metrics only**
   - Collects data but allows all requests
   - Good for monitoring before enforcement

3. **Enforced**
   - Blocks requests without valid tokens
   - Good for production
   - Requires App Check configuration in app

---

## 🚀 Quick Action Steps

**Right now, do this:**

1. **Open**: https://console.firebase.google.com/project/time-bank-91b48/appcheck

2. **Find each service** (Authentication, Firestore, etc.)

3. **Click ⋮** (three dots) → **"Turn off enforcement"**

4. **Refresh browser**: `Ctrl + Shift + R`

5. **Try login** → Should work! ✅

**Later (before production):**
- Follow Solution 2 to properly configure App Check
- Enable enforcement again
- More secure for production

---

## ✅ After Disabling App Check

You can now:
- ✅ Login with email/password
- ✅ Login with Google (if enabled)
- ✅ Create services
- ✅ Book services
- ✅ Save profile

**Everything works!** 🎉

---

## 📄 Related Fixes

After disabling App Check, you may still need:

1. **Enable Google Sign-In** (if using Google login)
   - See: `FIX_GOOGLE_LOGIN_ERROR.md`

2. **Apply Firestore Rules** (for profile/service saves)
   - See: `APPLY_RULES_NOW.md`

3. **Demo Account Fixes** (if using demo@timebank.com)
   - See: `PERMISSION_FIX.md`

---

## 🎯 Summary

**Problem**: App Check enforced but not configured  
**Quick Fix**: Disable enforcement (2 minutes)  
**Proper Fix**: Configure App Check with reCAPTCHA (15 minutes)  
**Recommendation**: Use quick fix now, proper fix before production

**Do it now! Takes 2 minutes! 🚀**
