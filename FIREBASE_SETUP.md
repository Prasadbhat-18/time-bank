# Firebase Setup Guide for TimeBank

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Click "Create a project"**
3. **Enter project name**: `timebank` (or any name you prefer)
4. **Disable Google Analytics** (optional for this project)
5. **Click "Create project"**

## Step 2: Enable Authentication

1. **In your Firebase project**, go to **Authentication** in the left sidebar
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Click on "Email/Password"**
5. **Enable** the first option (Email/Password)
6. **Save**

## Step 3: Create Firestore Database

1. **Go to "Firestore Database"** in the left sidebar
2. **Click "Create database"**
3. **Choose "Start in test mode"** (we'll add security rules later)
4. **Select a location** (choose closest to your users)
5. **Click "Done"**

## Step 4: Get Firebase Configuration

1. **Go to Project Settings** (gear icon in left sidebar)
2. **Scroll down to "Your apps"**
3. **Click the web icon** `</>`
4. **Enter app nickname**: `timebank-web`
5. **Check "Also set up Firebase Hosting"** (optional)
6. **Click "Register app"**
7. **Copy the config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyExample...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## Step 5: Update .env.local File

1. **Open `.env.local`** in your project root
2. **Replace the placeholder values** with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

## Step 6: Restart Development Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 7: Test the Setup

1. **Open** http://localhost:5173/
2. **Click "Sign up"**
3. **Create a test account** with any email/password
4. **You should be able to register and login successfully!**

## Initial Firestore Collections

The app will automatically create these collections when you use features:

- `users` - User profiles
- `skills` - Available skills
- `services` - Service offerings
- `bookings` - Service bookings
- `timeCredits` - User credit balances
- `transactions` - Credit transactions
- `reviews` - User reviews
- `userSkills` - User skill associations

## Security Rules (Optional - for production)

Add these Firestore rules for basic security:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All authenticated users can read skills
    match /skills/{document} {
      allow read: if request.auth != null;
    }
    
    // Users can read all services and create their own
    match /services/{document} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.uid == resource.data.provider_id;
    }
    
    // Users can read/write their own data
    match /{collection}/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

**If you see connection errors:**
1. Check that all environment variables are set correctly
2. Make sure there are no extra spaces in .env.local
3. Restart the dev server after changing .env.local
4. Check browser console for specific error messages

**If authentication fails:**
1. Verify Email/Password is enabled in Firebase Auth
2. Check the authDomain in your config
3. Ensure your project ID is correct

---

✅ **Once complete, your TimeBank app will have full authentication and data persistence!**