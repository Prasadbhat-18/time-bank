# TimeBank OTP Server

This is the backend server for handling OTP (One-Time Password) authentication using Twilio.

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Twilio Account Setup
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account (includes $15 credit)
3. Get your credentials:
   - **Account SID**: Found on your Console Dashboard
   - **Auth Token**: Found on your Console Dashboard (click to reveal)

### 3. Create Verify Service
1. In Twilio Console, go to **Verify** > **Services**
2. Click **Create new Service**
3. Enter service name: "TimeBank OTP"
4. Copy the **Service SID** (starts with VA...)

### 4. Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PORT=4000
   ```

### 5. Start the Server
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### 6. Test the Server
The server will run on `http://localhost:4000`

Test endpoints:
- **Health Check**: `GET /health`
- **Send OTP**: `POST /api/send-otp` with `{"phoneNumber": "+1234567890"}`
- **Verify OTP**: `POST /api/verify-otp` with `{"phoneNumber": "+1234567890", "otp": "123456"}`

## Phone Number Format
Use international format: `+[country code][phone number]`
- US: `+1234567890`
- India: `+919876543210`
- UK: `+447123456789`

## Troubleshooting

### "Account SID not found"
- Check your Account SID is correct
- Make sure you're using the Account SID, not the API Key SID

### "Service SID not found"
- Ensure you created a Verify Service in Twilio Console
- Use the Service SID (starts with VA...), not the Service Name

### "Phone number not verified"
- For trial accounts, you can only send to verified phone numbers
- Add your phone number in Twilio Console > Phone Numbers > Verified Caller IDs
- Or upgrade to a paid account for unrestricted sending

### "Invalid phone number"
- Use international format with country code
- Remove spaces, dashes, or parentheses
- Example: `+1234567890` not `(123) 456-7890`

## Free Tier Limits
- Twilio free tier includes $15 credit
- SMS costs ~$0.0075 per message
- You can send ~2000 OTP messages with free credit
- Upgrade for production use
