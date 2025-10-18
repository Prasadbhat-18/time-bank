# ✅ Get Your Existing Firebase Project Credentials

## 🎯 You Have: Existing Firebase Project `timebank`

Perfect! You just need to extract your credentials and add them to `.env` file.

---

## 🚀 QUICK STEPS (5 minutes)

### Step 1: Go to Firebase Console

**URL**: https://console.firebase.google.com

### Step 2: Select Your `timebank` Project

1. You should see your `timebank` project in the list
2. **Click** on it to open

### Step 3: Get Your Web App Config

1. **Click** the gear icon ⚙️ (top-left) → **"Project settings"**
2. **Scroll down** to **"Your apps"** section
3. **Look for your web app** - should see something like:
   ```
   📱 timebank-web
   or
   🕸️ timebank (web)
   ```

**If you don't see a web app:**
- Click the **web icon** `</>`
- Name: `timebank-web`
- Click "Register app"

### Step 4: Copy Your Config

Once you see your web app, **click on it** to reveal the config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // 👈 COPY THIS
  authDomain: "timebank-....firebaseapp.com",  // 👈 COPY THIS
  projectId: "timebank-...",            // 👈 COPY THIS
  storageBucket: "timebank-....appspot.com",   // 👈 COPY THIS
  messagingSenderId: "...",             // 👈 COPY THIS
  appId: "1:...:web:..."               // 👈 COPY THIS
};
```

**Copy each value** (you can also copy the entire config object)

### Step 5: Update Your `.env` File

**File location**: `c:\Users\prasa\Downloads\t1\time-bank\.env`

**Find these lines**:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Replace with your ACTUAL values from Step 4**:

Example:
```env
VITE_FIREBASE_API_KEY=AIzaSyDaM5f3w8LKn4K3QzE-8q8K9_n4K3Q
VITE_FIREBASE_AUTH_DOMAIN=timebank-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=timebank-abc123
VITE_FIREBASE_STORAGE_BUCKET=timebank-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xyz123abc456
```

### Step 6: Verify Services are Enabled

**In Firebase Console** for your `timebank` project:

1. **Authentication**:
   - Click "Authentication" (left menu)
   - Should show "Email/Password" enabled
   - If not: Click it → Enable toggle → Save

2. **Firestore Database**:
   - Click "Firestore Database" (left menu)
   - Should already exist
   - If not: Click "Create database" → "test mode" → Select region

3. **Firestore Rules**:
   - Click "Rules" tab in Firestore
   - Should allow authenticated users to read/write
   - If needed, update to:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Step 7: Restart Dev Server

**In PowerShell:**
```powershell
# If running, press Ctrl+C
npm run dev
```

**Check console for:**
```
✅ Firebase initialized successfully
```

---

## 🧪 TEST IT

### Test 1: Check Firebase Connection

**In browser console (F12 → Console):**

Should show:
```
Firebase env presence {
  VITE_FIREBASE_API_KEY: true,
  VITE_FIREBASE_PROJECT_ID: true
}
✅ Firebase initialized successfully
```

### Test 2: Try Register

1. Open http://localhost:5174/
2. Click "Sign up"
3. Enter:
   - Email: `test@example.com`
   - Password: `Test1234!`
   - Username: `TestUser`
4. Click "Sign up"

**Expected**: ✅ Success - logged in!

### Test 3: Try Login

1. Logout
2. Click "Login"
3. Use email/password from above
4. Click "Sign in"

**Expected**: ✅ Success - logged in!

### Test 4: Save Profile

1. Go to Profile → Edit Profile
2. Change something
3. Click "Save Changes"

**Expected**: ✅ "Profile updated successfully!"

---

## 📋 Mapping Your Firebase Config to `.env`

| Firebase Config | .env File Name |
|-----------------|----------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

---

## ✅ Verification Checklist

- [ ] Found your `timebank` project in Firebase Console
- [ ] Opened Project Settings
- [ ] Located your web app config
- [ ] Copied all 6 credential values
- [ ] Updated `.env` file with real values (not placeholders)
- [ ] No quotes around values in `.env`
- [ ] No spaces before/after `=` in `.env`
- [ ] Verified Authentication is enabled
- [ ] Verified Firestore Database exists
- [ ] Verified Firestore Rules allow writes
- [ ] Restarted dev server
- [ ] Browser console shows "✅ Firebase initialized successfully"
- [ ] Successfully registered account
- [ ] Successfully logged in
- [ ] Successfully saved profile changes

---

## 🆘 If Something Doesn't Work

### "Firebase not configured"

**Fix**: Check `.env` file - values should NOT have "your_" in them

```bash
# Check in PowerShell:
Get-Content .env | Select-String "VITE_FIREBASE"
# Should show real values, not "your_firebase..."
```

### "auth/invalid-api-key"

**Fix**: Make sure you copied the EXACT value from your Firebase project, not a placeholder

### "Missing or insufficient permissions"

**Fix**: Update Firestore Rules to allow authenticated users (see above)

### "Email/password not enabled"

**Fix**: 
1. Firebase Console → Authentication
2. Click "Email/Password"
3. Toggle to **ENABLE**
4. Click "Save"

---

## 🎉 SUCCESS!

Once you see:
- ✅ "✅ Firebase initialized successfully" in console
- ✅ Can register accounts
- ✅ Can login
- ✅ Can save data

**Your Firebase is fully connected and working!** 🔥

---

## 📞 Need More Help?

If you run into issues:

1. Check browser console (F12 → Console) for error messages
2. Verify `.env` file has real values (not placeholders)
3. Make sure all 6 Firebase env variables are present
4. Check Firebase project has Authentication and Firestore enabled
5. Restart dev server after `.env` changes

---

## ⏱️ Timeline

- **2 min**: Find Firebase project and copy config
- **1 min**: Update `.env` file
- **1 min**: Restart dev server
- **1 min**: Test login/signup

**Total**: 5 minutes! ✅
