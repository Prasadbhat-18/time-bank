# 🚀 QUICK FIX: Firebase Configuration Error

## ❌ Error You're Seeing

```
Google authentication is not available. Firebase configuration is missing.
```

## ✅ Why This Happens

Firebase configuration is either:
- Missing from `.env.local`
- Has invalid/placeholder values
- Dev server not restarted after .env changes

## 🔧 3-Step Fix (2 minutes)

### Step 1: Check `.env.local` File

**Open**: `.env.local` (in project root)

**Should contain** (make sure no placeholder text):
```env
VITE_FIREBASE_API_KEY=AIzaSyAtO0AzKkZxVaFFYHlmOmb-kV4_VZJXLGU
VITE_FIREBASE_AUTH_DOMAIN=time-bank-91b48.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=time-bank-91b48
VITE_FIREBASE_STORAGE_BUCKET=time-bank-91b48.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1006497280677
VITE_FIREBASE_APP_ID=1:1006497280677:web:29114ba77863a3829ed34c
```

**Check**:
- ✅ All 6 lines present
- ✅ No `your_api_key_here` placeholder text
- ✅ No quotes around values
- ✅ File is named `.env.local` (not `.env`)

### Step 2: Restart Dev Server

In PowerShell:
```powershell
# Press Ctrl+C to stop current server
npm run dev
```

### Step 3: Check Browser Console

Press **F12** → Click **Console** tab

**Look for** (should see one of these):
```
✅ Firebase initialized successfully
```

Or:
```
Firebase env presence {
  VITE_FIREBASE_API_KEY: true,
  VITE_FIREBASE_PROJECT_ID: true
}
```

---

## 🧪 Test It

1. **Open**: http://localhost:5174/
2. **Click**: "Google OAuth" button
3. **You should see**: Real Google login popup
4. **If error**: Check console (F12) for specific error

---

## 🆘 Still Seeing Error?

### Option A: Clear Everything
```javascript
// In browser console (F12):
localStorage.clear();
location.reload();
```

### Option B: Restart Browser
- Close browser tab
- Close dev server (Ctrl+C)
- Reopen http://localhost:5174/
- Try again

### Option C: Check Firebase Console

Go to: https://console.firebase.google.com

**Verify**:
- ✅ Project "time-bank-91b48" exists
- ✅ "Authentication" → "Sign-in method" → Google is **Enabled**
- ✅ Firestore Database is created

If Google is NOT enabled:
1. Click "Google" in Sign-in methods
2. Click toggle to enable
3. Click "Save"

---

## 📋 Quick Checklist

Before trying again:
- [ ] `.env.local` has Firebase values (no placeholders)
- [ ] Dev server restarted
- [ ] Browser console shows Firebase initialized
- [ ] Firebase project has Google auth enabled
- [ ] Popup blockers disabled for localhost

---

## 💡 Most Common Fix

**90% of the time**: Just restart the dev server!

```powershell
Ctrl+C
npm run dev
```

After restart, try Google login again.

---

## ✨ If It Works Now

✅ **Congrats!** Your Google login is working!

Try these:
1. Click "Google OAuth"
2. Sign in with your Google account
3. Get logged in ✅

---

## 📞 Still Need Help?

Read the detailed guide: `GOOGLE_LOGIN_TROUBLESHOOTING.md`
