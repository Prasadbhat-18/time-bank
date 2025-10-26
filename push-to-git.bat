@echo off
REM Push updated code to git repository

echo.
echo ========================================
echo 🚀 PUSHING UPDATES TO GIT REPOSITORY
echo ========================================
echo.

REM Change to project directory
cd /d "c:\Users\prasa\Downloads\t1\time-bank"

REM Check git status
echo 📋 Checking git status...
git status
echo.

REM Add all changes
echo 📝 Adding all changes...
git add .
echo ✅ Changes added
echo.

REM Commit changes
echo 💾 Committing changes...
git commit -m "feat: Add admin analytics, demo services deletion, and service deletion fixes

- Added comprehensive admin analytics service (adminAnalyticsService.ts)
- Track total logins, active users, and interactions
- Added 4 new analytics metric cards to admin dashboard
- Implemented demo/auto-generated services identification and deletion
- Added is_demo and is_auto_generated flags to Service type
- Created dedicated demo services section in admin panel
- Enhanced admin authority with tracking and management features
- Added documentation for admin dashboard and demo services
- Improved service deletion with proper UI feedback and loading states"
echo ✅ Changes committed
echo.

REM Push to repository
echo 🚀 Pushing to repository...
git push
echo ✅ Pushed successfully
echo.

echo ========================================
echo ✅ ALL UPDATES PUSHED TO GIT!
echo ========================================
echo.
pause
