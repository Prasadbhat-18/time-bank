# ⚡ Netlify Environment Variables - Quick Copy Paste

## 🎯 Just Copy & Paste These Into Netlify

Go to: **Netlify Dashboard → Your Site → Site Settings → Build & Deploy → Environment**

---

## ✅ REQUIRED (All Functions Work)

Add these 6 variables (get values from Firebase Console):

```
Key: VITE_FIREBASE_API_KEY
Value: your_firebase_api_key_here

Key: VITE_FIREBASE_AUTH_DOMAIN
Value: your_project.firebaseapp.com

Key: VITE_FIREBASE_PROJECT_ID
Value: your_project_id

Key: VITE_FIREBASE_STORAGE_BUCKET
Value: your_project.appspot.com

Key: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: your_sender_id

Key: VITE_FIREBASE_APP_ID
Value: your_app_id
```

---

## 🤖 OPTIONAL (For AI Chat)

Add this variable (get from Groq Console):

```
Key: VITE_GROQ_API_KEY
Value: your_groq_api_key_here
```

---

## 📱 OPTIONAL (For Real SMS)

Add this variable (deploy backend server separately):

```
Key: VITE_SERVER_URL
Value: https://your-server.herokuapp.com
```

---

## 📍 How to Get Firebase Values

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click ⚙️ Settings → Project Settings
4. Scroll to "Your apps" → Find your web app
5. Click the config button
6. Copy these values:

```
apiKey → VITE_FIREBASE_API_KEY
authDomain → VITE_FIREBASE_AUTH_DOMAIN
projectId → VITE_FIREBASE_PROJECT_ID
storageBucket → VITE_FIREBASE_STORAGE_BUCKET
messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID
appId → VITE_FIREBASE_APP_ID
```

---

## 📋 Step-by-Step in Netlify

1. Go to https://app.netlify.com/
2. Click your site name
3. Click "Site Settings"
4. Click "Build & Deploy"
5. Click "Environment"
6. Click "Edit Variables"
7. Click "Add a variable"
8. Enter Key and Value
9. Click "Save"
10. Repeat for each variable
11. Go to "Deployments"
12. Click "Trigger Deploy"
13. Done! ✅

---

## ✨ What Works

### With Just Firebase (6 variables)
✅ Google Login
✅ Phone Login
✅ Email Registration
✅ Service Marketplace
✅ Booking System
✅ Reviews & Ratings
✅ XP & Levels
✅ Emergency Contacts
✅ SOS Button
✅ Chat (no AI)
✅ Dark Mode
✅ Mobile Responsive

### Add Groq Key for AI Chat
✅ AI-enhanced messages
✅ Smart suggestions

### Add Server URL for Real SMS
✅ Real SMS OTP
✅ Real SOS distress messages

---

## 🚀 That's It!

Add the 6 Firebase variables to Netlify and your app is live! 🎉
