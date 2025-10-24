@echo off
echo Deploying updated Firestore rules for Google login fix...
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Firebase CLI is not installed
    echo Please install it with: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if logged in to Firebase
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Not logged in to Firebase
    echo Please run: firebase login
    pause
    exit /b 1
)

echo Deploying Firestore rules...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Firestore rules deployed successfully!
    echo.
    echo Google login users can now:
    echo - Edit and save their profiles
    echo - Gain XP when completing services
    echo - Level up automatically
    echo.
) else (
    echo.
    echo ❌ ERROR: Failed to deploy Firestore rules
    echo Please check your Firebase project configuration
    echo.
)

pause
