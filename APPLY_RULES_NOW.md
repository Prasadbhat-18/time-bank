# FIX: Apply These Rules to Firebase Console NOW

## The Problem
Your Firestore rules aren't applied yet, causing "insufficient permissions" errors.

## The Solution - Copy Rules Below

**Go to Firebase Console:**
1. Open: https://console.firebase.google.com/project/time-bank-91b48/firestore/rules
2. **DELETE ALL existing text** in the rules editor
3. **Copy the rules below** (entire block)
4. **Paste** into the Firebase Console rules editor
5. **Click "Publish"**
6. **Wait 30 seconds**

---

## COPY THESE RULES (START HERE) ⬇️

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update, delete: if isOwner(userId);
    }

    match /skills/{document} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    match /services/{serviceId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.provider_id == request.auth.uid;
    }

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

    match /reviews/{reviewId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.reviewer_id == request.auth.uid;
    }

    match /timeCredits/{userId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow write: if false;
    }

    match /transactions/{transactionId} {
      allow read: if isSignedIn() && 
        (resource.data.from_user_id == request.auth.uid || 
         resource.data.to_user_id == request.auth.uid);
      allow write: if false;
    }

    match /chats/{chatId} {
      allow read, write: if isSignedIn() && 
        request.auth.uid in resource.data.participant_ids;
      allow create: if isSignedIn() && 
        request.auth.uid in request.resource.data.participant_ids;
    }

    match /messages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.sender_id == request.auth.uid;
      allow delete: if false;
    }
  }
}
```

## COPY THESE RULES (END HERE) ⬆️

---

## After Pasting Rules:

1. **Click "Publish"** in Firebase Console
2. **Wait 60 seconds** for rules to propagate
3. **In your app:**
   - Press **Ctrl + Shift + R** (hard refresh)
   - **Logout** if logged in
   - **Login again** with Google (pnb580@gmail.com)
   - Try editing profile again

## Expected Result:
✅ Profile saves successfully
✅ No "insufficient permissions" error
✅ Console shows: "✅ Saved to Firestore users/[your-user-id]"

---

**DO THIS NOW - Takes 2 minutes!**
