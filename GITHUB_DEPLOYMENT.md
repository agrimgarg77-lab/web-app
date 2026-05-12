# GitHub Deployment Guide

This guide shows you how to deploy your Web Communication App using various GitHub-integrated platforms.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - Free & Easy)
1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/web-communication-app.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub account
   - Select your repository
   - Click "Deploy"

3. **Your app will be live at**: `https://your-app-name.vercel.app`

### Option 2: Heroku (Free Tier Available)
1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Your app will be live at**: `https://your-app-name.herokuapp.com`

### Option 3: Railway (Modern Alternative to Heroku)
1. **Go to [railway.app](https://railway.app)**
2. **Connect your GitHub account**
3. **Select your repository**
4. **Railway will automatically deploy your app**

### Option 4: DigitalOcean App Platform
1. **Go to [digitalocean.com/products/app-platform](https://digitalocean.com/products/app-platform)**
2. **Connect your GitHub account**
3. **Select your repository**
4. **Configure build settings** (Node.js, 3000 port)
5. **Deploy**

## 📋 Step-by-Step GitHub Setup

### 1. Create GitHub Repository
```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Web Communication App"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/web-communication-app.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages (For Static Demo)
Since this is a full-stack app, GitHub Pages alone won't work (it only serves static files). Use one of the options above instead.

### 3. Set Up Custom Domain (Optional)
For any platform above, you can add a custom domain:
- Go to your platform's dashboard
- Find "Domains" or "Custom Domains" section
- Add your domain (e.g., `yourapp.yourdomain.com`)
- Update DNS settings as instructed

## 🔧 Configuration Files Included

### Vercel Configuration (`vercel.json`)
- Automatically configured for Node.js apps
- Handles both server and static files

### Heroku Configuration (`Procfile`)
- Tells Heroku how to run your app
- Uses `node server.js` as the start command

### Docker Configuration (`Dockerfile`)
- For container-based deployments
- Works with any platform supporting Docker

### GitHub Actions (`.github/workflows/deploy.yml`)
- Automated deployment pipeline
- Triggers on push to main branch

## 🌐 Accessing Your App

Once deployed, your app will be accessible at:
- **Vercel**: `https://your-app-name.vercel.app`
- **Heroku**: `https://your-app-name.herokuapp.com`
- **Railway**: `https://your-app-name.railway.app`
- **DigitalOcean**: Your custom domain or provided URL

## 📱 Testing Your Deployed App

1. **Open the URL** in your browser
2. **Create a room** by entering any room ID
3. **Test features**:
   - Send messages
   - Share files
   - Share screen
   - Multiple users in same room

## 🔒 HTTPS Requirements

**Important**: Screen sharing requires HTTPS in production. All the platforms above automatically provide:
- ✅ HTTPS certificates
- ✅ Secure WebSocket connections
- ✅ Proper CORS headers

## 🛠️ Troubleshooting

### Common Issues:

1. **Screen sharing not working**
   - Ensure HTTPS is enabled (all platforms above provide this)
   - Check browser permissions
   - Update to latest browser

2. **File upload failing**
   - Check server logs on your platform
   - Ensure uploads directory has proper permissions
   - Verify file size limits

3. **Connection issues**
   - Check if WebSocket is working
   - Verify CORS settings
   - Check platform's firewall settings

### Platform-Specific Tips:

**Vercel**: 
- Check "Functions" tab for server logs
- Use `vercel logs` for CLI debugging

**Heroku**:
- Use `heroku logs --tail` for real-time logs
- Check "Resources" tab for app health

**Railway**:
- Check "Logs" tab in dashboard
- Monitor environment variables

## 📊 Monitoring

Most platforms provide built-in monitoring:
- **Vercel**: Analytics tab
- **Heroku**: Metrics dashboard
- **Railway**: Usage statistics
- **DigitalOcean**: Monitoring tools

## 💡 Pro Tips

1. **Environment Variables**: Set up proper environment variables for production
2. **Database**: Consider adding a database for persistent chat history
3. **Authentication**: Add user authentication for production use
4. **Scaling**: All platforms support easy scaling as your app grows

## 🎉 You're Ready!

Your Web Communication App is now ready for GitHub deployment. Choose any platform above, follow the steps, and your app will be live on the web in minutes!
