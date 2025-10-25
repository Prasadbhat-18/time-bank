# 🚀 Auto-Start OTP Server - Always Running

The Twilio OTP server now starts automatically! No need to manage separate terminals.

---

## 🎯 Quick Start

### Option 1: Using npm (Recommended)

```bash
npm start
```

This will:
1. ✅ Start OTP Server on port 4000
2. ✅ Start Vite dev server on port 5173
3. ✅ Both run together automatically

### Option 2: Using Batch File (Windows)

Double-click:
```
start-all.bat
```

This will:
1. ✅ Open OTP Server in a new window
2. ✅ Start Vite dev server in current window
3. ✅ Both run together automatically

### Option 3: Using PowerShell (Windows)

```powershell
.\start-all.ps1
```

This will:
1. ✅ Start OTP Server in a new PowerShell window
2. ✅ Start Vite dev server in current window
3. ✅ Both run together automatically

---

## 📋 Prerequisites

Make sure you have:

1. **server/.env file** with Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_SERVICE_SID=your_verify_service_sid
   PORT=4000
   NODE_ENV=development
   ```

2. **Dependencies installed**:
   ```bash
   npm install
   cd server && npm install
   ```

---

## 🔄 How It Works

When you run `npm start`:

```
1. Checks if server/.env exists
2. Installs server dependencies (if needed)
3. Starts OTP Server (port 4000)
4. Waits 3 seconds for server to initialize
5. Starts Vite dev server (port 5173)
6. Both run together in the same terminal
```

---

## 🌐 Access Points

Once running:

- **App:** http://localhost:5173
- **OTP Server:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

---

## 🛑 Stopping the Servers

Press `Ctrl+C` in the terminal to stop both servers gracefully.

---

## 🔧 Troubleshooting

### Error: "server/.env file not found"

**Solution:** Create the file:
```bash
cd server
copy .env.example .env
# Edit .env and add your Twilio credentials
```

### Error: "npm: command not found"

**Solution:** Install Node.js from https://nodejs.org/

### Server starts but app doesn't

**Solution:** Wait a few seconds, the server needs time to initialize

### Port already in use

**Solution:** 
- Change PORT in server/.env to a different number (e.g., 4001)
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :4000
  taskkill /PID <PID> /F
  ```

---

## 📝 Scripts Available

| Command | What it does |
|---------|------------|
| `npm start` | Start both server and app together |
| `npm start:all` | Same as `npm start` |
| `npm run dev` | Start only Vite dev server |
| `cd server && npm start` | Start only OTP server |

---

## ✅ Verification

To verify everything is running:

1. Open http://localhost:5173 - Should see the app
2. Open http://localhost:4000/health - Should see JSON response
3. Try phone login - Should work without errors

---

## 🎉 Benefits

✅ **No manual server management** - Server starts automatically  
✅ **Single command** - Just run `npm start`  
✅ **Always available** - Server ready when you need it  
✅ **Easy shutdown** - Ctrl+C stops both servers  
✅ **Cross-platform** - Works on Windows, Mac, Linux  

---

## 🆘 Still Having Issues?

Check the console output for error messages. The app will tell you exactly what's wrong and how to fix it.
