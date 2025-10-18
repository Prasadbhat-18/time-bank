# 💬 Chat Setup & Troubleshooting Guide

## 🚨 Current Issue

The chat functionality requires **Firebase Firestore** to work properly. Right now, Firebase is not configured, which is why the chat isn't working.

---

## 🎯 Quick Solution: Set Up Firebase (5 Minutes)

### Option 1: Use Firebase (Recommended for Full Features)

Firebase provides real-time chat, message syncing, and cloud storage - all for FREE up to certain limits.

#### Step 1: Create Firebase Project

1. **Go to**: https://console.firebase.google.com
2. **Click** "Add project" or "Create a project"
3. **Project name**: `timebank-chat` (or any name you like)
4. **Google Analytics**: Disable it (not needed)
5. **Click** "Create project"
6. **Wait** ~30 seconds for setup to complete

#### Step 2: Enable Firestore Database

1. **In your Firebase project**, click **"Firestore Database"** in left menu
2. **Click** "Create database"
3. **Select** "Start in **test mode**" (important!)
4. **Choose location**: Select closest to you (e.g., `us-central`, `europe-west`)
5. **Click** "Enable"

#### Step 3: Enable Authentication

1. **Click** "Authentication" in left menu
2. **Click** "Get started"
3. **Click** "Sign-in method" tab
4. **Click** "Email/Password"
5. **Enable** the toggle switch
6. **Click** "Save"

#### Step 4: Get Your Firebase Config

1. **Click** the gear icon ⚙️ next to "Project Overview"
2. **Click** "Project settings"
3. **Scroll down** to "Your apps" section
4. **Click** the web icon `</>`
5. **App nickname**: `timebank-web`
6. **Click** "Register app"
7. **Copy the firebaseConfig object**

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123...",
  authDomain: "timebank-chat.firebaseapp.com",
  projectId: "timebank-chat",
  storageBucket: "timebank-chat.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

#### Step 5: Add Config to Your Project

1. **Open** the file: `.env` in your project root
2. **Replace the placeholder values** with your actual Firebase values:

```env
VITE_FIREBASE_API_KEY=AIzaSyAbc123...
VITE_FIREBASE_AUTH_DOMAIN=timebank-chat.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=timebank-chat
VITE_FIREBASE_STORAGE_BUCKET=timebank-chat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**⚠️ Important**: 
- Don't use quotes around the values
- Make sure there are no spaces before or after the `=`
- Keep the `VITE_` prefix

#### Step 6: Restart Your Dev Server

In your terminal (PowerShell):
```powershell
# Press Ctrl+C to stop the current server
# Then restart:
npm run dev
```

#### Step 7: Test the Chat

1. **Open** http://localhost:5174/
2. **Login** with any demo account
3. **Go to Services** page
4. **Click** any service card
5. **Click** "Book Service" button
6. **Look for** the chat icon 💬
7. **Click it** to open chat
8. **Send a message** - it should work! ✅

---

## Option 2: Use Mock/Local Storage (No Firebase Needed)

If you don't want to set up Firebase, the app can use localStorage for chat (limited functionality).

### What Works Without Firebase:
✅ Send/receive messages (stored locally)
✅ Basic chat UI
✅ Message history (in browser only)

### What Doesn't Work:
❌ Real-time syncing across devices
❌ Cloud backup of messages
❌ Typing indicators
❌ Read receipts
❌ Message persistence across browsers

### To Use Local Mode:

The app will automatically use localStorage if Firebase is not configured. Just make sure the Firebase env variables are set to placeholder values (as they are now).

---

## 🔍 Troubleshooting

### Problem: "Chat still not working after Firebase setup"

**Check 1**: Verify Firebase is detected
1. Open browser console (F12 → Console)
2. Look for: `Firebase env presence`
3. Should show `true` for both keys

**Check 2**: Clear cache and reload
```javascript
// In browser console
localStorage.clear();
location.reload();
```

**Check 3**: Check Firestore rules
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Make sure it says "Start in test mode":
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

---

### Problem: "Permission denied" errors

**Solution**: Update Firestore rules

1. **Go to** Firebase Console → Firestore Database → Rules
2. **Replace with**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their chats
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write their messages
    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write their own user data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading services
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
3. **Click** "Publish"

---

### Problem: "Firebase not initialized"

**Check your .env file**:
```bash
# Make sure values don't have quotes
✅ CORRECT:
VITE_FIREBASE_API_KEY=AIzaSyAbc123...

❌ WRONG:
VITE_FIREBASE_API_KEY="AIzaSyAbc123..."
VITE_FIREBASE_API_KEY='AIzaSyAbc123...'
```

**Restart dev server**:
```powershell
# Stop with Ctrl+C, then:
npm run dev
```

---

### Problem: "Messages not showing up"

**Debug in console**:
```javascript
// Open browser console (F12)
// Check if messages are being saved:
const chats = JSON.parse(localStorage.getItem('timebank_shared_chats') || '[]');
console.log('Local chats:', chats);

const messages = JSON.parse(localStorage.getItem('timebank_shared_messages') || '[]');
console.log('Local messages:', messages);
```

**Clear and retry**:
```javascript
localStorage.clear();
location.reload();
// Then try sending messages again
```

---

## 📊 Firebase Free Tier Limits

Firebase offers generous free limits:

| Feature | Free Limit |
|---------|-----------|
| **Firestore Reads** | 50,000/day |
| **Firestore Writes** | 20,000/day |
| **Storage** | 1 GB |
| **Bandwidth** | 10 GB/month |
| **Authentication** | Unlimited |

**For a small app**, this is more than enough! 🎉

---

## 🎯 Testing Checklist

After setting up Firebase:

- [ ] Dev server restarted
- [ ] Console shows "Firebase env presence: true"
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can see services list
- [ ] Can click "Book Service"
- [ ] Chat icon appears
- [ ] Can open chat window
- [ ] Can send messages
- [ ] Messages appear in chat
- [ ] Messages persist after refresh

---

## 🚀 Advanced: Set Up Production Rules

For production, use stricter Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isChatParticipant(chatData) {
      return isSignedIn() && 
             request.auth.uid in chatData.participants;
    }
    
    // User documents
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update, delete: if isOwner(userId);
    }
    
    // Chat documents
    match /chats/{chatId} {
      allow read: if isSignedIn() && 
                     isChatParticipant(resource.data);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
                       isChatParticipant(resource.data);
    }
    
    // Chat messages
    match /chats/{chatId}/messages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
    }
    
    // Services (public read, authenticated write)
    match /services/{serviceId} {
      allow read: if true;
      allow create, update, delete: if isSignedIn();
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read, write: if isSignedIn();
    }
  }
}
```

---

## 📱 Features Enabled by Firebase

### Real-Time Chat
- ✅ Instant message delivery
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Online status

### Cloud Sync
- ✅ Messages sync across devices
- ✅ Access chat from anywhere
- ✅ Backup in cloud
- ✅ Never lose messages

### Security
- ✅ Encrypted connections (HTTPS)
- ✅ User authentication
- ✅ Access control rules
- ✅ Rate limiting

### Scalability
- ✅ Handles thousands of users
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ 99.95% uptime SLA

---

## 🆘 Still Need Help?

### Check Console Logs
Open browser DevTools (F12) and look for:
- Firebase initialization messages
- Error messages in red
- Network requests to Firestore

### Common Error Messages:

**"Firebase: Error (auth/invalid-api-key)"**
→ Check your `VITE_FIREBASE_API_KEY` is correct

**"Missing or insufficient permissions"**
→ Update Firestore rules (see above)

**"Firebase: Firebase App named '[DEFAULT]' already exists"**
→ Refresh the page (hot reload issue)

**"Network error"**
→ Check internet connection

---

## ✅ Quick Start Summary

1. **Create Firebase project** (2 min)
2. **Enable Firestore** (1 min)
3. **Enable Auth** (1 min)
4. **Copy config** (1 min)
5. **Update .env** (1 min)
6. **Restart server** (30 sec)
7. **Test chat** (30 sec)

**Total time: ~7 minutes** ⏱️

---

## 🎉 Done!

Once Firebase is set up, your chat will work perfectly with:
- ✅ Real-time messaging
- ✅ Message history
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Cloud backup

**Enjoy your fully functional chat! 💬**
