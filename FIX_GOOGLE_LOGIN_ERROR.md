# 🔧 FIX: Firebase auth/internal-error - Google Login

## ❌ Error You're Seeing:
```
Firebase: Error (auth/internal-error)
```

## 🎯 Root Cause:
**Google Sign-In is not enabled in your Firebase Console!**

This error happens when:
1. Google provider is not enabled in Firebase Authentication
2. Or OAuth configuration is incomplete

---

## ✅ SOLUTION: Enable Google Sign-In (5 minutes)

### Step 1: Go to Firebase Authentication

**Open this URL:**
```
https://console.firebase.google.com/project/time-bank-91b48/authentication/providers
```

### Step 2: Enable Google Provider

1. Click on **"Sign-in method"** tab (if not already there)
2. Find **"Google"** in the providers list
3. Click the **Edit** (pencil icon) on the Google row

### Step 3: Configure Google Provider

**Toggle "Enable" to ON**

You'll see two fields:

#### **Public-facing name** (optional):
- Leave as: `time-bank-91b48` or change to: `TimeBank App`

#### **Support email** (required):
- Enter your email: `pnb580@gmail.com`
- This email is shown to users during OAuth

### Step 4: Save Configuration

1. Click **"Save"** button
2. You should see: ✅ Google provider is now enabled

### Step 5: Verify OAuth Configuration

1. Still on the same page
2. Scroll to **"Authorized domains"**
3. Make sure these are listed:
   - ✅ `localhost` (for local development)
   - ✅ `time-bank-91b48.firebaseapp.com` (Firebase hosting)
   - ✅ Any custom domains you use

**Note**: `localhost` should be there by default!

---

## 🧪 Test Google Login (After Setup)

### Step 1: Restart Dev Server

Close terminal and restart:
```powershell
npm run dev
```

### Step 2: Hard Refresh Browser

```
Press: Ctrl + Shift + R
```

### Step 3: Try Google Login

1. Go to your app: http://localhost:5174/
2. Click **"Login with Google"**
3. Select your Google account
4. **Should work now!** ✅

### Expected Console Output:
```
Google login successful, user ID: [your-user-id]
User document does not exist, will create
Creating new user document in Firestore for: [your-user-id]
✅ User document created successfully in Firestore
```

---

## 🔍 Other Possible Causes (If Still Not Working)

### Cause 2: OAuth Consent Screen Not Configured

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=time-bank-91b48
2. Fill out **OAuth consent screen**:
   - App name: `TimeBank`
   - User support email: Your email
   - Developer contact: Your email
3. Add test users (your email)
4. Save

### Cause 3: API Key Restrictions

**Check:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=time-bank-91b48
2. Click on your **API Key**
3. Under "Application restrictions":
   - Should be: **None** OR
   - **HTTP referrers** with `localhost/*` allowed
4. Under "API restrictions":
   - Should be: **Don't restrict key** (for development)
5. Save if changed

### Cause 4: Wrong Firebase Project

**Verify** your `.env.local` has:
```bash
VITE_FIREBASE_PROJECT_ID=time-bank-91b48
```

**Check** it matches Firebase Console project name!

---

## 📋 Quick Checklist

Before testing, make sure:

- [ ] ✅ Google Sign-In **enabled** in Firebase Authentication
- [ ] ✅ Support email added (pnb580@gmail.com)
- [ ] ✅ `localhost` in authorized domains
- [ ] ✅ `.env.local` has correct project ID: `time-bank-91b48`
- [ ] ✅ Dev server restarted (`npm run dev`)
- [ ] ✅ Browser hard refreshed (Ctrl + Shift + R)
- [ ] ✅ Firestore rules applied (from `APPLY_RULES_NOW.md`)

---

## 🎯 Summary

**Main Issue**: Google Sign-In provider not enabled in Firebase Console

**Solution**: 
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add support email
4. Save
5. Restart dev server
6. Test login

**Time**: 5 minutes

---

## 📸 Visual Guide

### What to Click:

1. **Firebase Console** → Project `time-bank-91b48`
2. **Authentication** (left sidebar)
3. **Sign-in method** (tab at top)
4. **Google** (in the providers list)
5. **Edit** (pencil icon)
6. **Toggle "Enable" to ON**
7. **Support email**: Enter `pnb580@gmail.com`
8. **Save**

### Expected Result:
- Google row shows: **Enabled** ✅
- Status indicator is green

---

## 🚨 If Still Failing

Check browser console (F12) for the **exact error**:

### Common Errors:

**"auth/unauthorized-domain"**
- Add your domain to authorized domains list

**"auth/popup-blocked"**
- Allow popups in browser settings

**"auth/operation-not-allowed"**
- Google provider still not enabled (wait 1 min after saving)

**"auth/invalid-api-key"**
- Check `.env.local` has correct `VITE_FIREBASE_API_KEY`

---

## ✅ After Fixing

Once Google login works:

1. **Apply Firestore Rules** (from `APPLY_RULES_NOW.md`)
   - So profile saves work
   - So service creation works

2. **Test Full Flow**:
   - Login with Google ✅
   - Edit profile ✅
   - Create service ✅
   - Book service ✅

**Everything will work perfectly! 🎉**
