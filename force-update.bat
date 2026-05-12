@echo off
title FORCE UPDATE - Web Communication App
color 0C

echo.
echo ========================================
echo    FORCE UPDATE - Vercel Deployment
echo ========================================
echo.
echo This will force an immediate update to Vercel
echo.

echo [1/3] Creating force deployment trigger...
git commit --allow-empty -m "trigger: FORCE DEPLOYMENT - Fix all functionality"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create trigger
    pause
    exit /b 1
)

echo [2/3] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push
    pause
    exit /b 1
)

echo [3/3] Creating additional trigger...
git commit --allow-empty -m "trigger: EMERGENCY DEPLOYMENT - All features must work"
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push emergency trigger
    pause
    exit /b 1
)

echo.
echo ========================================
echo    FORCE UPDATE COMPLETED!
echo ========================================
echo.
echo Multiple deployment triggers sent to Vercel!
echo.
echo Your app should update within 1-2 minutes.
echo.
echo Press any key to open your app...
pause > nul
start https://web-app-nine-delta-56.vercel.app

echo.
echo Press any key to open Vercel dashboard...
pause > nul
start https://vercel.com/dashboard

echo.
echo Update process complete!
pause > nul
