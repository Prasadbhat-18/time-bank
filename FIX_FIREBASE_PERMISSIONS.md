# URGENT: Fix Firebase Permission Error

## 🚨 Problem

You're seeing this error:
```
FirebaseError: Missing or insufficient permissions.
```

**Why?** You logged in with Google (`pnb580@gmail.com`), which is a **real Firebase user**, but your Firestore database doesn't have the right security rules to allow that user to read/write data.

---

## ✅ Solution: Update Firestore Security Rules

### Step 1: Open Firebase Console

1. Go to: https://console.firebase.google.com
2. Select your project: **time-bank-91b48**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top

### Step 2: Replace Rules

**Current rules** (probably):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // No access!
    }
  }
}
```

**Replace with these rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Skills collection - all authenticated users can read
    match /skills/{skillId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Allow creating skills
    }
    
    // Services collection - read all, write your own
    match /services/{serviceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.provider_id;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.provider_id;
    }
    
    // Bookings - read/write if you're involved
    match /bookings/{bookingId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.seeker_id ||
        request.auth.uid == resource.data.provider_id
      );
      allow create: if request.auth != null && request.auth.uid == request.resource.data.seeker_id;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.seeker_id ||
        request.auth.uid == resource.data.provider_id
      );
    }
    
    // Time credits - read/write your own
    match /timeCredits/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions - read if you're involved
    match /transactions/{transactionId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.sender_id ||
        request.auth.uid == resource.data.recipient_id
      );
      allow create: if request.auth != null;
    }
    
    // Reviews - read all, write your own
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.reviewer_id;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.reviewer_id;
    }
    
    // User skills - read/write your own
    match /userSkills/{userSkillId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
    
    // Chats - read/write if you're a participant
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
    
    // Emergency contacts - read/write your own
    match /emergencyContacts/{contactId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
  }
}
```

### Step 3: Publish Rules

1. Click **Publish** button (top right)
2. Wait for confirmation: "Rules published successfully"
3. **Refresh your browser**

### Step 4: Test Again

1. Go back to your app: http://localhost:5174/
2. You should already be logged in (Google session)
3. Go to **Profile** → **Edit Profile**
4. Change your username
5. Click **Save Changes**
6. ✅ **Should work now!**

---

## 🎯 Alternative: Use Demo Accounts (No Firebase Setup Needed)

If you don't want to mess with Firebase rules, just use the demo accounts:

### Logout of Google Account

1. Click your profile picture → **Logout**

### Login with Demo Account

**Level 5 Demo**:
- Email: `level5@timebank.com`
- Password: `level5demo`

**Level 7 Demo**:
- Email: `level7@timebank.com`
- Password: `level7demo`

These accounts work with **localStorage only** (no Firebase needed), so they'll work immediately!

---

## 📋 Quick Comparison

| Feature | Google Login | Demo Accounts |
|---------|-------------|---------------|
| **Setup Required** | Yes (Firebase rules) | No |
| **Real Authentication** | Yes | No (mock) |
| **Data Persistence** | Firestore | localStorage |
| **Profile Editing** | ❌ (needs rules) | ✅ Works now |
| **Multi-Device** | Yes | No (browser only) |
| **Best For** | Production | Development/Testing |

---

## 🐛 Still Not Working?

### Check Firebase Rules Applied

1. Open browser console (F12)
2. Try to save profile again
3. Look for the error

**If you still see**:
```
FirebaseError: Missing or insufficient permissions
```

**Then**:
1. Make sure you clicked **Publish** in Firebase console
2. Wait 30 seconds for rules to propagate
3. **Hard refresh** your browser (Ctrl+Shift+R)
4. Try again

**If you see different error**, copy the full error message and share it.

---

## 💡 Recommended Approach

### For Development (Right Now):
**Use demo accounts** - they work immediately without Firebase setup.

### For Production (Later):
**Set up Firebase properly** with the security rules above so real users can sign up with Google/Email.

---

## 📞 Need More Help?

If you choose to fix Firebase, tell me:
1. Did you update the Firestore rules?
2. Did you click Publish?
3. What error do you see now (if any)?

If you choose demo accounts:
1. Just logout and login with `level5@timebank.com` / `level5demo`
2. Should work immediately!

---

**Quick Fix**: Just use `level5@timebank.com` / `level5demo` for now! 🚀
