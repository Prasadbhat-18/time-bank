# 🚨 COMPLETE LOGIN FIX - Google & Email Not Working

## 🎯 Current Status

**Dev Server**: Running on http://localhost:5175/  
**Issues**: Both Google and Email login not working  
**Need**: Step-by-step diagnosis and fix

---

## 📋 STEP-BY-STEP FIX CHECKLIST

### ✅ **STEP 1: Check Firebase Console Settings** (CRITICAL!)

#### **A. Enable Authentication Methods**

1. **Open Authentication Settings**:
   ```
   https://console.firebase.google.com/project/time-bank-91b48/authentication/providers
   ```

2. **Check Email/Password**:
   - Should show: ✅ **Enabled**
   - If not: Click **Edit** → Toggle **Enable** → **Save**

3. **Check Google**:
   - Should show: ✅ **Enabled**
   - If not: Click **Edit** → Toggle **Enable** → Add support email → **Save**

#### **B. Disable App Check Enforcement**

1. **Open App Check**:
   ```
   https://console.firebase.google.com/project/time-bank-91b48/appcheck
   ```

2. **For Authentication**:
   - If showing **"Enforced"** or **"Metrics only"**
   - Click **⋮** (three dots) → **"Turn off enforcement"**

3. **For Firestore**:
   - Same as above → **"Turn off enforcement"**

#### **C. Verify Authorized Domains**

1. **Go to Authentication Settings**:
   ```
   https://console.firebase.google.com/project/time-bank-91b48/authentication/settings
   ```

2. **Scroll to "Authorized domains"**:
   - Must include: ✅ `localhost`
   - Must include: ✅ `time-bank-91b48.firebaseapp.com`
   - If not: Click **"Add domain"** → Add `localhost`

---

### ✅ **STEP 2: Verify .env.local File**

1. **Check file exists**:
   ```powershell
   ls .env.local
   ```

2. **Verify contents**:
   - Open: `c:\Users\prasa\Downloads\t1\time-bank\.env.local`
   - Should have these values (exactly):
   ```bash
   VITE_FIREBASE_API_KEY=AIzaSyAtO0AzKkZxVaFFYHlmOmb-kV4_VZJXLGU
   VITE_FIREBASE_AUTH_DOMAIN=time-bank-91b48.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=time-bank-91b48
   VITE_FIREBASE_STORAGE_BUCKET=time-bank-91b48.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1006497280677
   VITE_FIREBASE_APP_ID=1:1006497280677:web:29114ba77863a3829ed34c
   ```

3. **Important**: No quotes around values, no spaces!

---

### ✅ **STEP 3: Clear Browser Cache & Restart**

1. **Close ALL browser windows**

2. **Clear browser cache**:
   - Press: `Ctrl + Shift + Delete`
   - Select: "Cached images and files"
   - Time range: "All time"
   - Click: "Clear data"

3. **Open FRESH browser window**:
   - Go to: http://localhost:5175/
   - Press: `Ctrl + Shift + R` (hard refresh)

---

### ✅ **STEP 4: Test Login with Console Open**

1. **Open Developer Console**:
   - Press: `F12`
   - Go to **"Console"** tab

2. **Clear Console**:
   - Click the 🚫 icon to clear old logs

3. **Try Email Login**:
   - Email: `demo@timebank.com`
   - Password: `demo123`
   - Watch console for errors

4. **Try Google Login**:
   - Click "Login with Google"
   - Watch console for errors

5. **Copy ALL console errors** and send them to me

---

## 🔍 COMMON ERRORS & FIXES

### Error 1: "auth/internal-error"

**Cause**: Google Sign-In not enabled

**Fix**:
```
1. Go to: https://console.firebase.google.com/project/time-bank-91b48/authentication/providers
2. Click "Google" → Edit
3. Toggle "Enable" to ON
4. Support email: pnb580@gmail.com
5. Save
```

---

### Error 2: "auth/firebase-app-check-token-is-invalid"

**Cause**: App Check enforcement enabled

**Fix**:
```
1. Go to: https://console.firebase.google.com/project/time-bank-91b48/appcheck
2. Find "Authentication" section
3. Click ⋮ → "Turn off enforcement"
4. Repeat for "Firestore"
```

---

### Error 3: "auth/unauthorized-domain"

**Cause**: localhost not in authorized domains

**Fix**:
```
1. Go to: https://console.firebase.google.com/project/time-bank-91b48/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Enter: localhost
5. Save
```

---

### Error 4: "Missing or insufficient permissions"

**Cause**: Firestore rules not applied

**Fix**:
```
1. Go to: https://console.firebase.google.com/project/time-bank-91b48/firestore/rules
2. Copy rules from: APPLY_RULES_NOW.md (lines 21-94)
3. Delete ALL existing text
4. Paste rules
5. Click "Publish"
6. Wait 60 seconds
```

---

### Error 5: "Firebase not configured"

**Cause**: .env.local missing or wrong values

**Fix**:
```
1. Check file exists: .env.local
2. Verify values match Firebase Console
3. Restart dev server: Ctrl+C → npm run dev
```

---

## 🧪 DIAGNOSTIC COMMANDS

Run these in PowerShell to check your setup:

```powershell
# Check if .env.local exists
Get-Content .env.local

# Check what port dev server is on
netstat -ano | findstr :5175

# Restart dev server
npm run dev
```

---

## 📊 MANUAL TEST CHECKLIST

Go through this checklist **one by one**:

### Firebase Console Checks:
- [ ] Email/Password authentication **Enabled**
- [ ] Google authentication **Enabled**
- [ ] Google has support email set
- [ ] App Check **NOT enforced** for Authentication
- [ ] App Check **NOT enforced** for Firestore
- [ ] `localhost` in Authorized domains
- [ ] Firestore rules published

### Local Checks:
- [ ] `.env.local` file exists
- [ ] `.env.local` has correct project ID: `time-bank-91b48`
- [ ] Dev server running (should show URL in terminal)
- [ ] Browser cache cleared
- [ ] Using correct URL: http://localhost:5175/

### Test Checks:
- [ ] Console (F12) open before testing
- [ ] No errors in console on page load
- [ ] Email login shows specific error (if fails)
- [ ] Google login shows specific error (if fails)

---

## 🎯 QUICK RESET (If All Else Fails)

### Option A: Use Demo Account (Works Immediately)

Demo accounts bypass Firebase completely:

```
Email: demo@timebank.com
Password: demo123

OR

Email: level5@timebank.com
Password: level5

OR

Email: level7@timebank.com
Password: level7
```

These should **ALWAYS work** because they use localStorage only.

---

### Option B: Complete Reset

```powershell
# Stop dev server
# Press Ctrl+C

# Clear node modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Restart dev server
npm run dev
```

---

## 📞 SEND ME THIS INFO

If still not working, send me:

### 1. Console Errors (F12 → Console tab)
Copy ALL red errors when you try to login

### 2. Firebase Console Screenshots
- Authentication → Providers page
- App Check page (showing enforcement status)

### 3. .env.local Contents
```powershell
Get-Content .env.local
```

### 4. What you see when trying to login
- Button does nothing?
- Popup opens then closes?
- Error message shown?
- What's the exact error text?

---

## 🚀 MOST LIKELY FIX

**95% of login issues are caused by:**

1. **App Check enforcement** (Turn it OFF)
2. **Google Sign-In not enabled** (Turn it ON)
3. **Browser cache** (Clear it)

**Do these 3 things first!**

---

## ✅ SUCCESS INDICATORS

### When Email Login Works:
```
Console should show:
✅ Firebase initialized successfully
✅ User authenticated
No errors starting with "auth/"
```

### When Google Login Works:
```
Console should show:
Google login successful, user ID: [some-id]
✅ User document created successfully
OR
User document found in Firestore
```

---

## 📄 Related Documentation

- `FIX_APP_CHECK_ERROR.md` - App Check issues
- `FIX_GOOGLE_LOGIN_ERROR.md` - Google login issues
- `APPLY_RULES_NOW.md` - Firestore rules
- `PERMISSION_FIX.md` - Permission errors

---

## 🎯 DO THIS RIGHT NOW:

**Priority 1 (Takes 5 minutes):**

1. **Open 3 browser tabs**:
   - Tab 1: https://console.firebase.google.com/project/time-bank-91b48/authentication/providers
   - Tab 2: https://console.firebase.google.com/project/time-bank-91b48/appcheck
   - Tab 3: http://localhost:5175/

2. **In Tab 1**: Verify Email & Google are **Enabled** ✅

3. **In Tab 2**: Turn off App Check enforcement for Authentication & Firestore

4. **In Tab 3**: Clear cache → Hard refresh → Try demo login first

**Demo login MUST work. If it doesn't, something is very wrong with your setup!**

---

**Test demo account first, then tell me what happens! 🚀**
