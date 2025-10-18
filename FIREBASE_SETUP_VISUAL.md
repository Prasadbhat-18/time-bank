# 📸 VISUAL STEP-BY-STEP: Get Firebase Credentials

## 🎯 Goal
Get REAL Firebase credentials to replace placeholder values in `.env`

---

## STEP 1: Open Firebase Console

**Go to**: https://console.firebase.google.com

You should see:
```
┌─────────────────────────────────────────┐
│  Firebase                               │
│  ├─ My Projects                         │
│  └─ [Your existing projects here]       │
│                                         │
│  [+ Add project] button                 │
└─────────────────────────────────────────┘
```

---

## STEP 2: Select or Create Project

### If you have NO projects:
1. Click **[+ Add project]** button
2. **Name**: `timebank`
3. **Analytics**: Turn OFF (not needed)
4. **Click**: Create project
5. **Wait** ~1 minute while it initializes

### If you HAVE a project:
1. **Click** on your project name
2. You'll be in the project console

---

## STEP 3: Find Project Settings

You should see this menu on LEFT side:
```
┌──────────────────────────┐
│  Build                   │
│  ├─ Authentication       │
│  ├─ Firestore Database   │
│  ├─ Storage              │
│  └─ ...                  │
│                          │
│  Manage (gear icon ⚙️)   │
│  ├─ Project settings <── CLICK THIS
│  ├─ Users and                      
│  └─ ...                  │
└──────────────────────────┘
```

**Click**: ⚙️ gear icon → **"Project settings"**

---

## STEP 4: Scroll to "Your apps"

In Project Settings page, scroll DOWN until you see:

```
┌─────────────────────────────────────────┐
│  Yours apps                             │
│                                         │
│  ╔════════════════════════════════════╗ │
│  ║ 📱 App                             ║ │
│  ║    (if you have one already)       ║ │
│  ╚════════════════════════════════════╝ │
│                                         │
│  Or:                                    │
│  [web] [iOS] [Android] [Unity]         │
│     ↑                                   │
│   CLICK WEB ICON                        │
└─────────────────────────────────────────┘
```

---

## STEP 5: Register Web App

### If NO apps yet:
1. Click **web icon** `</>`
2. **App nickname**: `timebank-web`
3. Check: "Also set up Firebase Hosting"
4. Click: **"Register app"**

A modal will appear with code. Scroll down...

---

## STEP 6: COPY Your Configuration

You'll see JavaScript code like this:

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// ... more imports ...

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaM5f3w8LKn4K3QzE-8q8K9_n4K3Q",              👈 COPY
  authDomain: "timebank-app.firebaseapp.com",                 👈 COPY
  projectId: "timebank-app",                                  👈 COPY
  storageBucket: "timebank-app.appspot.com",                  👈 COPY
  messagingSenderId: "987654321098",                          👈 COPY
  appId: "1:987654321098:web:xyz123abc456"                    👈 COPY
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```

**COPY THE ENTIRE firebaseConfig OBJECT** (just the values part)

---

## STEP 7: Update Your `.env` File

**Open file**: `c:\Users\prasa\Downloads\t1\time-bank\.env`

**Find these lines**:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Replace with your REAL values**:
```env
VITE_FIREBASE_API_KEY=AIzaSyDaM5f3w8LKn4K3QzE-8q8K9_n4K3Q
VITE_FIREBASE_AUTH_DOMAIN=timebank-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=timebank-app
VITE_FIREBASE_STORAGE_BUCKET=timebank-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321098
VITE_FIREBASE_APP_ID=1:987654321098:web:xyz123abc456
```

**✅ Example mapping:**
```
Firebase Config             →  .env File
─────────────────────────────────────────────────────────────
apiKey                      →  VITE_FIREBASE_API_KEY
authDomain                  →  VITE_FIREBASE_AUTH_DOMAIN
projectId                   →  VITE_FIREBASE_PROJECT_ID
storageBucket               →  VITE_FIREBASE_STORAGE_BUCKET
messagingSenderId           →  VITE_FIREBASE_MESSAGING_SENDER_ID
appId                       →  VITE_FIREBASE_APP_ID
```

---

## STEP 8: Enable Authentication

**Back in Firebase Console:**

1. **Left menu**: Click **"Authentication"**
2. **Click**: "Get started" (if first time)
3. **Click**: "Email/Password" option
4. **Toggle**: Turn ON (make it BLUE)
5. **Click**: "Save"

```
┌─────────────────────────────────────────┐
│  Sign-in method                         │
│                                         │
│  ✓ Email/Password    [Toggle: ON] 🔵   │
│  ○ Phone             [Toggle: OFF]     │
│  ○ Google            [Toggle: OFF]     │
│  ○ Facebook          [Toggle: OFF]     │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## STEP 9: Enable Firestore

1. **Left menu**: Click **"Firestore Database"**
2. **Click**: "Create database" button
3. **Select**: "Start in **test mode**" ⚠️ IMPORTANT
4. **Choose**: Region (pick closest: us-central, europe-west1, etc.)
5. **Click**: "Enable"

**Wait** ~1 minute for Firestore to initialize

---

## STEP 10: Update Firestore Rules

1. In Firestore, click **"Rules"** tab at top
2. **Delete** all existing rules
3. **Paste** this:

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

4. **Click**: "Publish" button

---

## STEP 11: Restart Dev Server

**In PowerShell:**
```powershell
# Stop current server with Ctrl+C
# Wait 2 seconds
npm run dev
```

**You should see**:
```
✅ Firebase initialized successfully
```

---

## STEP 12: Test Login

1. **Open**: http://localhost:5174/
2. **Click**: "Sign up"
3. **Enter**:
   - Email: `test@example.com`
   - Password: `Test1234!`
   - Username: `TestUser`
4. **Click**: "Sign up"

**Expected**: 
- ✅ Success!
- ✅ Logged in
- ✅ No errors

---

## STEP 13: Verify in Firebase Console

1. **Firebase Console** → Your project
2. **Firestore Database** → Collections
3. **Look for**: "users" collection
4. **Should see**: Your user document

```
collections/
└─ users/
   └─ [user-id]/
      ├─ email: "test@example.com"
      ├─ username: "TestUser"
      ├─ bio: ""
      └─ ... other fields
```

---

## ✅ You're Done!

**Your TimeBank app now has:**
- ✅ Real Firebase authentication
- ✅ Cloud data storage in Firestore
- ✅ Full functionality
- ✅ No more errors!

---

## 🐛 If Something Goes Wrong

### Error: "Firebase not configured"

**Fix**: Check `.env` file - values should NOT contain "your_" or "test"

### Error: "auth/invalid-api-key"

**Fix**: Copy credentials again from Firebase Console, make sure EXACT match

### Error: "Missing or insufficient permissions"

**Fix**: Update Firestore Rules (see Step 10)

### Error: "auth/operation-not-allowed"

**Fix**: Make sure Email/Password is toggled ON in Authentication

---

## 📋 What Each Value Means

| Value | Description |
|-------|-------------|
| **apiKey** | Your app's API key (public, safe to share) |
| **authDomain** | Firebase authentication domain |
| **projectId** | Your Firebase project ID (unique) |
| **storageBucket** | Cloud Storage bucket |
| **messagingSenderId** | Cloud Messaging ID |
| **appId** | App ID (unique identifier) |

---

## 🎯 Summary

1. ✅ Open Firebase Console
2. ✅ Create/select project
3. ✅ Get credentials from Project Settings
4. ✅ Update `.env` file
5. ✅ Enable Authentication (Email/Password)
6. ✅ Enable Firestore (test mode)
7. ✅ Update Firestore Rules
8. ✅ Restart dev server
9. ✅ Test login/signup
10. ✅ Verify data in Firebase

**All done! Your app now stores data in Firebase! 🎉**
