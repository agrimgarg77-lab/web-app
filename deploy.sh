#!/bin/bash

# Web Communication App Deployment Script
# This script helps deploy to various platforms

echo "🚀 Web Communication App Deployment Script"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Web Communication App"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote repository found"
    echo "Please create a GitHub repository and run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/web-communication-app.git"
    echo "git push -u origin main"
    exit 1
fi

echo "📋 Choose your deployment platform:"
echo "1) Vercel (Recommended - Free & Easy)"
echo "2) Railway (Modern Alternative)"
echo "3) Heroku (Classic Choice)"
echo "4) DigitalOcean (Production Ready)"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🌐 Deploying to Vercel..."
        echo "📋 Instructions:"
        echo "1. Go to https://vercel.com"
        echo "2. Click 'Import Project'"
        echo "3. Connect your GitHub account"
        echo "4. Select your repository"
        echo "5. Click 'Deploy'"
        echo ""
        echo "🔗 Direct link: https://vercel.com/new"
        echo "✅ Your app will be live at: your-app-name.vercel.app"
        ;;
    2)
        echo "🚂 Deploying to Railway..."
        echo "📋 Instructions:"
        echo "1. Go to https://railway.app"
        echo "2. Connect your GitHub account"
        echo "3. Select your repository"
        echo "4. Railway auto-deploys your app"
        echo ""
        echo "🔗 Direct link: https://railway.app/new"
        echo "✅ Your app will be live at: your-app-name.railway.app"
        ;;
    3)
        echo "🌿 Deploying to Heroku..."
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI not found"
            echo "Install it with: npm install -g heroku"
            exit 1
        fi
        
        echo "📋 Instructions:"
        echo "1. Login to Heroku: heroku login"
        echo "2. Create app: heroku create your-app-name"
        echo "3. Deploy: git push heroku main"
        echo "4. Open app: heroku open"
        echo ""
        echo "🔗 Direct link: https://dashboard.heroku.com/new"
        echo "✅ Your app will be live at: your-app-name.herokuapp.com"
        ;;
    4)
        echo "🌊 Deploying to DigitalOcean..."
        echo "📋 Instructions:"
        echo "1. Go to https://cloud.digitalocean.com/apps"
        echo "2. Connect your GitHub account"
        echo "3. Select your repository"
        echo "4. Configure build settings"
        echo "5. Deploy"
        echo ""
        echo "🔗 Direct link: https://cloud.digitalocean.com/apps"
        echo "✅ Your app will be live at: your-app-name.ondigitalocean.app"
        ;;
    5)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo "2. Follow the platform-specific instructions above"
echo "3. Test your deployed app"
echo "4. Share the URL with others!"
echo ""
echo "📚 For detailed help, see: HOSTING_GUIDE.md"
echo "🎉 Happy deploying!"
