# Debug Guide: Profile Updates & Geolocation

## 🔧 Issues Fixed

### 1. Profile Update Error - FIXED
**Problem**: Users (especially level5-demo and level7-demo) not found when trying to update profile.

**Root Cause**: Demo accounts from mockData.ts weren't being loaded into the mockUsers array from localStorage.

**Solution**: Added `ensureDemoAccounts()` function that ensures all demo accounts are always present in mockUsers array.

### 2. Enhanced Logging
Added comprehensive console logging to help debug any remaining issues:
- User lookup logs
- Update process logs
- Storage operation logs
- Geolocation step-by-step logs
- Error messages with details

---

## 🧪 How to Test & Debug

### Test Profile Update (Level 5)

1. **Open Browser Console** (F12 → Console tab)

2. **Login**:
   ```
   Email: level5@timebank.com
   Password: level5demo
   ```

3. **Go to Profile** → Click "Edit Profile"

4. **Change Username**:
   ```
   Old: time_master_demo
   New: MyCustomName123
   ```

5. **Click "Save Changes"**

6. **Check Console Logs** (you should see):
   ```
   handleSave called
   Current user: { id: 'level5-demo', username: 'time_master_demo', ... }
   Edit data: { username: 'MyCustomName123', ... }
   Updated fields to save: { username: 'MyCustomName123', ... }
   updateUser called with userId: level5-demo updates: { username: 'MyCustomName123', ... }
   User updated successfully: { id: 'level5-demo', username: 'MyCustomName123', ... }
   Saved to localStorage
   Profile updated successfully in AuthContext
   ```

7. **Check Alert**: Should see "Profile updated successfully!"

8. **Verify Changes**:
   - Header should show "MyCustomName123"
   - Refresh page - changes persist
   - Check localStorage: `timebank_users` (see updated user)

---

### Test Geolocation

1. **Edit Profile** (click Edit Profile button)

2. **Click Map Pin Button** (📍) next to Location field

3. **Grant Permission** when browser asks:
   ```
   Browser prompt: "Allow location access?"
   Click: "Allow"
   ```

4. **Check Console Logs** (you should see):
   ```
   handleGetLocation called
   Requesting current location...
   Location received: { lat: 40.7128, lng: -74.0060, accuracy: 20, ... }
   Reverse geocoding coordinates: 40.7128 -74.0060
   Fetching address from Nominatim API...
   Nominatim response: { display_name: "...", address: {...} }
   Address resolved: Main Street, New York, NY, USA
   ```

5. **Check Alert**: Should see "Location detected: [Your Address]"

6. **Check Location Field**: Should auto-fill with address

7. **Click "Save Changes"** to persist

---

## 🐛 Troubleshooting

### Error: "User not found"

**Symptoms**: Alert says "Failed to update profile: User not found: [user-id]"

**Debug Steps**:
1. Check console for: "User not found in mockUsers: [user-id]"
2. Look for: "Available users:" log showing all user IDs
3. Verify your user ID is in the list

**Solution**:
```javascript
// Clear localStorage and reload
localStorage.clear();
location.reload();
// Then login again
```

---

### Error: "Failed to get your location"

**Symptoms**: Alert after clicking GPS button

**Possible Causes**:

#### 1. Permission Denied
**Console shows**: `Location access denied`

**Solution**:
- Click the 🔒 lock icon in browser address bar
- Set Location to "Ask" or "Allow"
- Reload page and try again

#### 2. Location Unavailable
**Console shows**: `Location information unavailable`

**Solution**:
- Enable location services on your device
- Windows: Settings → Privacy → Location → On
- Check if GPS is working (try Google Maps)

#### 3. Timeout
**Console shows**: `Location request timed out`

**Solution**:
- Move to area with better GPS signal
- Try again (may need a few seconds)
- Use manual entry if persistent

#### 4. API Error
**Console shows**: `Nominatim API error: 429` (Rate limit)

**Solution**:
- Wait 1 second between requests
- If blocked, coordinates will be shown: "40.7128, -74.0060"
- Enter address manually or try again later

---

## 📊 Console Commands for Debugging

### Check Current User
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('timebank_user'));
console.log('Current user:', user);
```

### Check All Users
```javascript
const users = JSON.parse(localStorage.getItem('timebank_users'));
console.log('All users:', users);
console.log('User IDs:', users.map(u => u.id));
```

### Check if Level 5 Demo Exists
```javascript
const users = JSON.parse(localStorage.getItem('timebank_users'));
const level5 = users.find(u => u.id === 'level5-demo');
console.log('Level 5 demo:', level5);
```

### Manually Add Demo User (Emergency Fix)
```javascript
const users = JSON.parse(localStorage.getItem('timebank_users')) || [];
const level5Demo = {
  id: 'level5-demo',
  email: 'level5@timebank.com',
  username: 'time_master_demo',
  bio: 'Level 5 Time Master - Custom pricing unlocked!',
  phone: '+1-555-LEVEL5',
  reputation_score: 4.8,
  total_reviews: 28,
  level: 5,
  experience_points: 1250,
  services_completed: 25,
  custom_credits_enabled: true,
  created_at: new Date('2024-01-10').toISOString()
};
users.push(level5Demo);
localStorage.setItem('timebank_users', JSON.stringify(users));
console.log('Level 5 demo user added!');
```

### Test Geolocation Directly
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('✅ Location:', position.coords.latitude, position.coords.longitude);
  },
  (error) => {
    console.error('❌ Error:', error.message);
  }
);
```

---

## 🔍 Step-by-Step Debugging

### Profile Update Not Working

**Step 1: Verify User is Logged In**
```javascript
// Console:
const user = JSON.parse(localStorage.getItem('timebank_user'));
console.log('Logged in user:', user);
// Should show user object with id, username, etc.
```

**Step 2: Verify User Exists in mockUsers**
```javascript
const users = JSON.parse(localStorage.getItem('timebank_users'));
const foundUser = users.find(u => u.id === user.id);
console.log('User in mockUsers:', foundUser);
// Should find the user
```

**Step 3: Try Update**
```javascript
// Click "Save Changes" and watch console
// Should see logs:
// - handleSave called ✓
// - Current user: {...} ✓
// - updateUser called with userId: ... ✓
// - User updated successfully ✓
// - Saved to localStorage ✓
```

**Step 4: Verify Update Persisted**
```javascript
const users = JSON.parse(localStorage.getItem('timebank_users'));
const updatedUser = users.find(u => u.id === user.id);
console.log('Updated user:', updatedUser);
// Should show new username
```

---

### Geolocation Not Working

**Step 1: Check Browser Supports Geolocation**
```javascript
if ('geolocation' in navigator) {
  console.log('✅ Geolocation supported');
} else {
  console.log('❌ Geolocation NOT supported');
}
```

**Step 2: Check Permission Status**
```javascript
navigator.permissions.query({ name: 'geolocation' }).then((result) => {
  console.log('Permission status:', result.state);
  // Should be: 'granted', 'prompt', or 'denied'
});
```

**Step 3: Test Location Request**
```javascript
console.log('Requesting location...');
navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log('✅ Success:', {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    });
  },
  (err) => {
    console.error('❌ Error:', err.code, err.message);
    // Code 1 = Permission denied
    // Code 2 = Position unavailable
    // Code 3 = Timeout
  },
  { enableHighAccuracy: true, timeout: 10000 }
);
```

**Step 4: Test Reverse Geocoding**
```javascript
const lat = 40.7128;
const lng = -74.0060;
fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
  headers: { 'User-Agent': 'TimeBank-App/1.0' }
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Address:', data.display_name);
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

---

## 📱 Mobile Testing

### iOS Safari
1. Settings → Safari → Location → Ask
2. Open app, grant permission when prompted
3. GPS more accurate outdoors

### Android Chrome
1. Settings → Site Settings → Location → Allow
2. Open app, grant permission when prompted
3. High accuracy mode requires GPS + WiFi

### Desktop
- Location based on IP address (less accurate)
- May show city-level instead of street-level
- Chrome: More accurate than Firefox usually

---

## ✅ Expected Behavior

### Profile Update
```
User clicks "Save Changes"
     ↓
handleSave() called
     ↓
Check user exists ✓
     ↓
Call updateUser(updates)
     ↓
AuthContext.updateUser()
     ↓
dataService.updateUser(userId, updates)
     ↓
Find user in mockUsers ✓
     ↓
Merge updates ✓
     ↓
Save to localStorage ✓
     ↓
Update AuthContext state ✓
     ↓
Save current user to localStorage ✓
     ↓
UI re-renders with new data ✓
     ↓
Alert: "Profile updated successfully!" ✓
```

### Geolocation
```
User clicks 📍 button
     ↓
handleGetLocation() called
     ↓
Show loading spinner ✓
     ↓
Call getCurrentLocation()
     ↓
Request browser permission
     ↓
User clicks "Allow"
     ↓
GPS/network positioning (2-5 sec)
     ↓
Receive coordinates ✓
     ↓
Call reverseGeocode(lat, lng)
     ↓
Fetch from Nominatim API
     ↓
Parse address response ✓
     ↓
Format address nicely ✓
     ↓
Update location field ✓
     ↓
Hide loading spinner ✓
     ↓
Alert: "Location detected: [address]" ✓
```

---

## 🎯 Quick Fixes

### Reset Everything
```javascript
// Nuclear option - clear all data and start fresh
localStorage.clear();
location.reload();
```

### Fix Missing Demo Accounts
```javascript
// Re-initialize demo accounts
const demos = [
  { id: 'level5-demo', email: 'level5@timebank.com', username: 'time_master_demo', level: 5 },
  { id: 'level7-demo', email: 'level7@timebank.com', username: 'time_immortal_demo', level: 7 }
];
// This happens automatically now on app load
```

### Force Permission Reset (Chrome)
1. Click 🔒 in address bar
2. Click "Site settings"
3. Reset all permissions
4. Reload page

---

## 📞 Support Info

If issues persist, provide these details:

1. **Console Logs**: Copy all red errors
2. **Browser**: Chrome/Firefox/Safari, version?
3. **Device**: Desktop/Mobile, OS version?
4. **Steps**: What did you do before error?
5. **User ID**: Which account? (check localStorage)

---

## ✨ All Fixed Features

✅ Profile update works for all accounts
✅ Demo accounts always available
✅ Comprehensive error logging
✅ Better error messages
✅ Geolocation with permission handling
✅ Reverse geocoding with fallback
✅ Address formatting (readable)
✅ Loading indicators
✅ Success/error alerts
✅ Console debugging tools

**Everything should work now! Check console logs if any issues occur.**
