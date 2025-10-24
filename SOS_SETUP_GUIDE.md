# 🚨 SOS Distress Message Setup Guide

## Real-Time SMS Distress Messages

This guide explains how to set up real-time SMS distress message sending for the SOS emergency feature.

---

## ✅ Prerequisites

1. **Twilio Account** - Sign up at https://www.twilio.com
2. **Node.js Server Running** - Backend server must be running
3. **Emergency Contacts Configured** - Add contacts in your profile

---

## 🔧 Setup Instructions

### Step 1: Get Twilio Credentials

1. Go to https://console.twilio.com/
2. Find your **Account SID** and **Auth Token**
3. Get a **Twilio Phone Number** (e.g., +1234567890)
4. Create a **Verify Service** (optional, for OTP)

### Step 2: Create .env File in Server Directory

Create `server/.env` file with:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
TWILIO_SERVICE_SID=your_verify_service_sid_here
PORT=4000
```

**Example:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+14155552671
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=4000
```

### Step 3: Start the Server

```bash
cd server
npm start
```

**Expected Output:**
```
✅ Twilio configuration loaded successfully
📱 Ready to send real SMS via Twilio Verify
Server running on port 4000
```

### Step 4: Add Emergency Contacts

1. Go to your Profile
2. Scroll to "Emergency Contacts"
3. Add contact with:
   - Name: Contact name
   - Phone: +91XXXXXXXXXX (with country code)
   - Relationship: Family/Friend/etc

### Step 5: Test SOS

1. Click the red **SOS Button** (bottom-right)
2. Click **ACTIVATE SOS**
3. Wait 3 seconds for countdown
4. Distress message sent via SMS

---

## 📊 What Happens When SOS Activates

### Frontend (Your App)
```
1. Click SOS button
2. 3-second countdown
3. Get GPS location
4. Create distress message with:
   - Your username
   - GPS coordinates
   - Google Maps link
   - Timestamp
5. Send to each emergency contact
```

### Backend (Server)
```
1. Receive distress message request
2. Validate phone numbers
3. Format message
4. Send via Twilio SMS API
5. Return message SID
6. Log success/failure
```

### Emergency Contact Receives
```
SMS Message:
🚨 EMERGENCY DISTRESS ALERT 🚨

I NEED IMMEDIATE HELP!

From: john_doe

📍 Location: https://maps.google.com/maps?q=28.123456,77.654321

Coordinates:
Latitude: 28.123456
Longitude: 77.654321

⏰ Time: 10/24/2025, 10:48:30 PM

🆘 This is an automated SOS distress message. Contact me immediately!
```

---

## 🔍 Troubleshooting

### Issue: "Twilio not configured properly"
**Solution:** Check that all three variables are set in `.env`:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

### Issue: "Phone number must include country code"
**Solution:** Use format: `+91XXXXXXXXXX` (with + and country code)

### Issue: "Failed to send distress message"
**Solution:** 
1. Check server is running: `npm start` in server folder
2. Verify .env file has correct credentials
3. Check console logs for error details

### Issue: "No emergency contacts configured"
**Solution:** Add at least one contact in your Profile > Emergency Contacts

### Issue: Message not received
**Solution:**
1. Check phone number format (+91XXXXXXXXXX)
2. Verify Twilio account has credits
3. Check Twilio console for message logs
4. Verify phone number is correct

---

## 📱 Console Logs to Check

When SOS activates, check browser console for:

```
🚨 SOS ACTIVATED - Sending REAL distress messages via SMS
📨 Sending REAL SMS distress message to John Doe (+919876543210)...
✅ Distress message sent successfully to John Doe
🆔 Message SID: SM1234567890abcdef
📊 Message status: queued
```

Server logs should show:
```
🚨 Sending DISTRESS MESSAGE via SMS...
📱 Target phone number: +919876543210
✅ Distress message sent successfully in 245ms
📊 Message status: queued
🆔 Message SID: SM1234567890abcdef
```

---

## 🎯 Real-Time Message Flow

```
User Clicks SOS
    ↓
3-Second Countdown
    ↓
Get GPS Location
    ↓
Create Distress Message
    ↓
For Each Emergency Contact:
    ├─ Format Phone Number
    ├─ Send to Server (/api/send-distress)
    ├─ Server Sends via Twilio
    ├─ Receive Message SID
    └─ Store in localStorage
    ↓
Show Success Alert
    ↓
Emergency Contact Receives SMS
```

---

## ✨ Features

✅ Real-time SMS delivery
✅ GPS location sharing
✅ Google Maps link
✅ Automatic message formatting
✅ Multiple contact support
✅ Message tracking (SID)
✅ Error handling
✅ Detailed logging

---

## 🔐 Security Notes

- Only authenticated users can activate SOS
- Location only shared with configured contacts
- Phone numbers validated before sending
- Twilio credentials stored server-side
- Messages logged for tracking

---

## 📞 Support

If messages aren't sending:
1. Check browser console for errors
2. Check server console for errors
3. Verify .env file configuration
4. Verify Twilio account has credits
5. Check phone number format

---

## 🚀 You're All Set!

Your SOS distress message system is now ready for real-time emergency notifications!
