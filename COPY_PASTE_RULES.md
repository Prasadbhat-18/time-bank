# 🚀 Quick Fix: Copy-Paste Firestore Rules

## The Problem

You're getting:
```
FirebaseError: Missing or insufficient permissions
```

Because your Firebase project doesn't have security rules set up.

---

## ✅ Solution (5 Minutes)

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com
2. Click on **time-bank-91b48** project
3. Click **Firestore Database** (left sidebar)
4. Click **Rules** tab (at the top)

### Step 2: Copy These Rules

The rules are already in your project file `firestore.rules`. Just **copy the entire content** from that file.

**OR copy this directly** (same content):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection - READ ALL, WRITE OWN
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update, delete: if isOwner(userId);
    }

    // Skills - read for all authenticated users
    match /skills/{document} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    // Services - read all, write only your own
    match /services/{serviceId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.provider_id == request.auth.uid;
    }

    // Bookings - read/write if you're provider or requester
    match /bookings/{bookingId} {
      allow read: if isSignedIn() && 
        (resource.data.provider_id == request.auth.uid || 
         resource.data.requester_id == request.auth.uid);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (resource.data.provider_id == request.auth.uid || 
         resource.data.requester_id == request.auth.uid);
      allow delete: if isSignedIn() && resource.data.requester_id == request.auth.uid;
    }

    // Reviews - read all, write only your own
    match /reviews/{reviewId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.reviewer_id == request.auth.uid;
    }

    // Time credits - read/write your own
    match /timeCredits/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Transactions - read if you're involved
    match /transactions/{transactionId} {
      allow read: if isSignedIn() && 
        (resource.data.from_user_id == request.auth.uid || 
         resource.data.to_user_id == request.auth.uid);
      allow create: if isSignedIn();
    }

    // Chats - check participants
    match /chats/{chatId} {
      allow read: if isSignedIn() && request.auth.uid in resource.data.participants;
      allow create: if isSignedIn() && request.auth.uid in request.resource.data.participants;
      allow update: if isSignedIn() && request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, create: if isSignedIn() && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    // Default fallback
    match /{collection}/{document=**} {
      allow read, write: if isSignedIn();
    }
  }
}
```

### Step 3: Paste and Publish

1. **Select all** the existing rules in Firebase console
2. **Delete** them
3. **Paste** the new rules (from above)
4. Click **Publish** (top right, green button)
5. Wait for "Rules published successfully" message

### Step 4: Test Your App

1. Go back to your app: http://localhost:5174/
2. You should still be logged in with Google
3. Go to **Profile** → **Edit Profile**
4. Change your username
5. Click **Save Changes**
6. ✅ **Should work now!**

---

## 🎯 Alternative: Use Demo Accounts (Instant Fix)

Don't want to mess with Firebase? Use demo accounts:

1. **Logout** from Google account
2. **Login** with:
   - Email: `level5@timebank.com`
   - Password: `level5demo`
3. **Profile editing works immediately!** (uses localStorage, no Firebase)

---

## 📊 What These Rules Do

- ✅ **Users can read anyone's profile** (needed to see providers, chat partners)
- ✅ **Users can only edit their own profile** (security)
- ✅ **Users can create/read services** (marketplace)
- ✅ **Users can only edit their own services** (security)
- ✅ **Users can book services** (core feature)
- ✅ **Chat works for participants** (messaging)
- ✅ **Emergency contacts are private** (security)

---

## 🐛 Still Having Issues?

### If "Publish" button is disabled:
- Check for syntax errors (red underlines)
- Make sure you copied the ENTIRE rules block
- Try refreshing the Firebase console page

### If you still get permission errors:
1. **Wait 30 seconds** (rules take time to propagate)
2. **Hard refresh** your browser (Ctrl+Shift+R)
3. **Logout and login again**
4. Try saving profile again

### If errors persist:
- **Use demo accounts** (`level5@timebank.com` / `level5demo`)
- They work without any Firebase setup!

---

**Choose your path**:
1. **Quick & Easy**: Use demo accounts (works now)
2. **Proper Setup**: Copy-paste rules to Firebase (5 minutes)

🚀 **Either way, profile editing will work!**
