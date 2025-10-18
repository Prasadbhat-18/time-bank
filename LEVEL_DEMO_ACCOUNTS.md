# Level Demo Accounts

## Overview
Two special demo accounts have been created to showcase the level system features, particularly the custom pricing functionality that unlocks at Level 5.

## Available Demo Accounts

### 1. Level 5 Master Demo Account 🏆
**Purpose**: Demonstrate custom pricing unlock and Level 5 perks

**Login Credentials**:
- **Email**: `level5@timebank.com`
- **Password**: `level5demo`
- **Username**: `time_master_demo`

**Account Details**:
- **Level**: 5 (Time Master)
- **Experience Points**: 1,250 XP
- **Services Completed**: 25 services
- **Reputation**: 4.8 / 5.0
- **Total Reviews**: 28
- **Time Credits Balance**: 35 credits
- **Total Earned**: 80 credits
- **Total Spent**: 45 credits

**Key Features Unlocked**:
- ✅ **Custom Pricing** - Can set own credit rates for services
- ✅ 15% credit bonus on earnings
- ✅ 15% discount on service bookings
- ✅ Priority listing in search results
- ✅ Verified badge
- ✅ 3 featured services at a time
- ✅ All lower-level perks (visibility boost, basic badge, etc.)

**Test Scenarios**:
1. Login using email tab with credentials above
2. Navigate to "Services" → "Create Service"
3. See the gold "🏆 Level 5 - Custom Pricing Unlocked" badge
4. Set custom credit rate (minimum 0.5, steps of 0.5)
5. View profile to see all unlocked perks
6. Check level progress and next level requirements

---

### 2. Level 7 Immortal Demo Account ✨
**Purpose**: Showcase maximum level perks and legendary status

**Login Credentials**:
- **Email**: `level7@timebank.com`
- **Password**: `level7demo`
- **Username**: `time_immortal_demo`

**Account Details**:
- **Level**: 7 (Time Immortal)
- **Experience Points**: 6,500 XP
- **Services Completed**: 95 services
- **Reputation**: 5.0 / 5.0 (Perfect!)
- **Total Reviews**: 82
- **Time Credits Balance**: 120 credits
- **Total Earned**: 250 credits
- **Total Spent**: 130 credits

**Key Features Unlocked**:
- ✅ **Custom Pricing** - Full control over service rates
- ✅ **30% credit bonus** on all earnings (maximum)
- ✅ **25% discount** on all service bookings (maximum)
- ✅ **Elite priority** - Top of all search results
- ✅ **Legendary badge** - Exclusive purple immortal badge
- ✅ **5 featured services** at a time
- ✅ **Priority support** access
- ✅ **Early access** to new features
- ✅ **Mentorship badge** - Can mentor other users
- ✅ **All previous level perks** (1-6)

**Test Scenarios**:
1. Login using email tab with credentials above
2. View profile to see Level 7 Immortal badge with special purple styling
3. Check full perk list showing all 35+ unlocked perks
4. Create a service with custom pricing (bonus earnings apply)
5. Browse services to see maximum discount applied
6. View level progress showing "Maximum Level Reached!"

---

## How to Login

### Option 1: Quick Login Buttons (Recommended)
Both the **LoginForm** and **RegisterForm** now include quick access buttons:

**In LoginForm**:
- Look for the 🏆 "Level 5" button (amber/gold styling)
- Look for the ✨ "Level 7" button (purple/violet styling)
- Click either button for instant login

**In RegisterForm**:
- Similar buttons available alongside "Demo Account" button
- Click to register and auto-login as that level demo account

### Option 2: Manual Login via Email Tab
1. Click the "Email" tab in LoginForm
2. Enter email: `level5@timebank.com` OR `level7@timebank.com`
3. Enter password: `level5demo` OR `level7demo`
4. Click "Login" button

---

## Editing Profile Names
Once logged in with either demo account, you can customize the username:

1. Navigate to **Profile** (user icon in top-right or navigation menu)
2. Click the **Edit Profile** button
3. Change the username field to your preferred name
4. Click **Save Changes**

The account will retain all level data, XP, services completed, and perks while using your custom name.

---

## Level System Features to Test

### Custom Pricing (Level 5+)
1. Navigate to Services → Create Service
2. Notice the gold badge indicating custom pricing is unlocked
3. Enter custom credit rate (try values like 2.5, 5.0, 10.0)
4. Post the service and see it listed with your custom rate

### Earning Bonuses
- Complete bookings as the demo account
- Level 5: Earns 15% bonus credits (1.0 base → 1.15 earned)
- Level 7: Earns 30% bonus credits (1.0 base → 1.30 earned)

### Booking Discounts
- Book services from other users
- Level 5: Pays 15% less (1.0 base → 0.85 paid)
- Level 7: Pays 25% less (1.0 base → 0.75 paid)

### Visual Indicators
- Profile badges show level number and color
- Service cards display provider level
- Progress bars show XP toward next level
- Unlocked perks displayed in grid format

---

## Technical Details

### Mock Data Location
Both accounts are defined in `src/services/mockData.ts`:
- User objects with full profile data
- Time credit balances initialized
- Level, XP, and service counts pre-set

### Authentication Logic
Handled in `src/contexts/AuthContext.tsx`:
- Hardcoded credentials for quick access
- Works in both Firebase and mock modes
- Falls back to these accounts if Firebase auth fails

### UI Components
Level demo buttons added to:
- `src/components/Auth/LoginForm.tsx` (lines ~480-545)
- `src/components/Auth/RegisterForm.tsx` (lines ~150-180)

---

## Troubleshooting

### "Invalid credentials" error
- Ensure you're using the exact email and password listed above
- Check that you're in the "Email" tab, not "Phone" tab
- Try using the quick login buttons instead

### Can't see custom pricing option
- Confirm you're logged in as Level 5 or Level 7 account
- Check profile page shows correct level (5 or 7)
- Try logging out and logging back in
- Clear browser cache and try again

### Changes not saving
- Ensure mock data mode is active (check browser console)
- Changes may not persist across browser refreshes in mock mode
- For persistent data, configure Firebase backend

---

## Additional Demo Accounts

For comparison, other demo accounts are available:

- **Basic Demo**: `demo@timebank.com` / `demo123` (Level 1)
- **Official Account**: `official@timebank.com` / `official123` (Level 7)

---

## Next Steps

1. Test both Level 5 and Level 7 accounts
2. Create services with custom pricing
3. Complete bookings to see bonus earnings
4. Explore all unlocked perks in profile
5. Compare with Level 1 demo account to see progression

For full level system documentation, see:
- `LEVEL_SYSTEM_GUIDE.md` - Complete technical guide
- `LEVEL_SYSTEM_QUICKSTART.md` - Quick reference for developers
