@echo off
title Web Communication App - Vercel Update Tool
color 0A

echo.
echo ========================================
echo    Web Communication App Updater
echo ========================================
echo.

echo [1/6] Checking current status...
git status
echo.

echo [2/6] Adding all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add changes
    pause
    exit /b 1
)
echo Changes added successfully!
echo.

echo [3/6] Creating commit...
set commit_msg=update: Automated update at %date% %time%
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create commit
    pause
    exit /b 1
)
echo Commit created successfully!
echo.

echo [4/6] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push to GitHub
    pause
    exit /b 1
)
echo Pushed to GitHub successfully!
echo.

echo [5/6] Triggering Vercel deployment...
git commit --allow-empty -m "trigger: Force Vercel deployment"
if %errorlevel% neq 0 (
    echo ERROR: Failed to trigger deployment
    pause
    exit /b 1
)

git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push deployment trigger
    pause
    exit /b 1
)
echo Vercel deployment triggered!
echo.

echo [6/6] Final status check...
git status
echo.

echo ========================================
echo    UPDATE COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your app will be updated on Vercel within 2-3 minutes.
echo.
echo Next steps:
echo 1. Go to vercel.com/dashboard
echo 2. Watch for new deployment
echo 3. Test your app when deployment shows "Ready"
echo.
echo Your app URL: web-app-nine-delta-56.vercel.app
echo.
echo Press any key to open Vercel dashboard...
pause > nul
start https://vercel.com/dashboard

echo.
echo Press any key to exit...
pause > nul
