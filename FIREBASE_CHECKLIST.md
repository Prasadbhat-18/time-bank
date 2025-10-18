# ✅ Firebase Setup Checklist

## Status Check

### Step 1: Firestore Rules ✅
- [x] Opened Firebase Console
- [x] Navigated to Firestore Database → Rules
- [x] Pasted rules from COPY_PASTE_RULES.md
- [x] Clicked Publish
- [ ] **Waited 30-60 seconds for propagation**

---

### Step 2: Test Profile Update
- [ ] Refreshed browser (Ctrl+R)
- [ ] Opened console (F12)
- [ ] Logged in with Google account
- [ ] Went to Profile → Edit Profile
- [ ] Changed username
- [ ] Clicked Save Changes
- [ ] **Result**: ___________________

**Expected in console**:
```
✅ Saved to Firestore users/[your-id]
```

**Expected alert**:
```
Profile updated successfully!
```

---

### Step 3: Verify in Firebase Console
- [ ] Opened https://console.firebase.google.com/project/time-bank-91b48/firestore
- [ ] Clicked **users** collection
- [ ] Found user: DQT8pOKnOTc2OVpPdcZnCCiMqcD3
- [ ] Verified username updated
- [ ] **Result**: ___________________

---

### Step 4: Test Service Creation
- [ ] Went to Dashboard
- [ ] Clicked Create Service
- [ ] Filled in details
- [ ] Submitted form
- [ ] **Result**: ___________________

**Expected in console**:
```
✅ Saved to Firestore services/[service-id]
```

---

### Step 5: Verify Service in Firebase
- [ ] Went to Firebase Console
- [ ] Clicked **services** collection
- [ ] Found new service (top of list)
- [ ] Verified all fields present
- [ ] **Result**: ___________________

---

## 🎯 Final Verification

### Run This Test:

1. **Create some data** (2 services, update profile)
2. **Open console**, run:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. **After reload**:
   - [ ] Data loads from Firebase
   - [ ] Services reappear in Dashboard
   - [ ] Profile data intact
   - [ ] **Result**: ___________________

---

## 📊 Status

### ✅ ALL WORKING
If all checkboxes above are checked and no errors:
**🎉 Firebase persistence is fully operational!**

### ⚠️ PARTIAL
If some work but not others:
**🔧 Check specific errors in console**

### ❌ NOT WORKING
If still getting permission errors:
**📞 Share console error messages**

---

## 🐛 Common Issues

### Still seeing permission errors?
**Wait**: Rules can take 30-60 seconds to propagate  
**Try**: Hard refresh (Ctrl+Shift+R)  
**Verify**: Rules show as "Published" in Firebase Console

### Data saves to localStorage but not Firebase?
**Check**: Console for "Firebase not configured" message  
**Verify**: `.env.local` has VITE_FIREBASE_* values  
**Try**: Restart dev server (Ctrl+C, `npm run dev`)

### Firebase Console empty?
**Check**: You're looking at correct project (time-bank-91b48)  
**Verify**: Logged in with same Google account  
**Try**: Refresh Firebase Console page

---

## 🎉 Success = All Green

When working correctly, you'll see:

**Browser Console**:
```
🚀 Initializing data from Firebase...
✅ Loaded 5 items from Firestore users
✅ Saved to Firestore users/[id]
✅ Saved to Firestore services/[id]
✅ Firebase initialization complete
```

**Firebase Console**:
```
📁 Firestore Database
  ├── 📂 users (4+ documents)
  ├── 📂 services (your services)
  ├── 📂 bookings (if any)
  └── ⏰ Recent timestamps
```

**App Behavior**:
```
✅ Profile saves
✅ Services create
✅ Data persists
✅ No error alerts
```

---

**Current Status**: Testing... ⏳

**Next**: Fill in the checkboxes as you test each step!
