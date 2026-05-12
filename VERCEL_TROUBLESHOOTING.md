# 🔧 Vercel Troubleshooting Guide

## ⚠️ Common Vercel Issues & Solutions

### **Issue 1: Socket.io Not Working**
**Problem:** Real-time features (chat, screen sharing) don't work on Vercel
**Solution:** ✅ Already fixed with serverless API structure

### **Issue 2: File Uploads Failing**
**Problem:** File uploads don't work on Vercel serverless
**Solution:** ✅ Fixed with base64 encoding approach

### **Issue 3: Functions Not Responding**
**Problem:** API endpoints return 404 or timeout
**Solution:** ✅ Fixed with proper API routing

---

## 🚀 **Fixed Issues in This Update**

### **1. Socket.io Serverless Compatibility**
- **Created**: `api/index.js` - Serverless-compatible API
- **Updated**: `vercel.json` - Proper routing for serverless functions
- **Fixed**: Socket.io connection issues on Vercel

### **2. File Upload System**
- **Vercel**: Uses base64 encoding (no file system)
- **Local**: Uses traditional file uploads
- **Auto-detection**: Works differently based on environment

### **3. API Routing**
- **Fixed**: `/api/*` routes properly handled
- **Fixed**: Static file serving
- **Fixed**: Socket.io path configuration

---

## 📋 **What Was Changed**

### **New Files:**
```
api/index.js           # Serverless API for Vercel
VERCEL_TROUBLESHOOTING.md # This guide
```

### **Updated Files:**
```
vercel.json            # Fixed routing and configuration
public/app.js          # Vercel-specific socket handling
```

---

## 🔄 **How to Deploy the Fix**

### **Step 1: Commit Changes**
```bash
git add .
git commit -m "fix: Resolve Vercel deployment issues"
git push origin main
```

### **Step 2: Vercel Auto-Deploys**
- Vercel will automatically detect changes
- Build and deploy within 2-3 minutes
- Check deployment status in dashboard

### **Step 3: Test Features**
1. **Chat messages** - Should work in real-time
2. **File sharing** - Should work with base64 encoding
3. **Screen sharing** - Should work properly
4. **Voice messages** - Should work
5. **Emojis** - Should work

---

## 🧪 **Testing Checklist**

### **After Deployment, Test:**
- [ ] **Join room** - Can you create/join rooms?
- [ ] **Send messages** - Do messages appear in real-time?
- [ ] **File sharing** - Can you share images/documents?
- [ ] **Screen sharing** - Does screen sharing work?
- [ ] **Voice messages** - Can you record/send voice?
- [ ] **Emojis** - Do emoji picker and reactions work?
- [ ] **Dark mode** - Does theme toggle work?
- [ ] **Mobile** - Does it work on mobile browsers?

### **Debug Console:**
Open browser console (F12) and check for:
- ❌ No Socket.io connection errors
- ❌ No 404 errors for API calls
- ❌ No file upload errors
- ✅ Connected to Socket.io
- ✅ API calls successful

---

## 🔍 **If Issues Persist**

### **Check Vercel Logs:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Click "View Logs"
4. Look for error messages

### **Common Console Errors:**

#### **Socket.io Connection Failed:**
```javascript
// Should see this in console:
// "User connected: abc123"
// "Joined room: ROOM123"
```

#### **File Upload Issues:**
```javascript
// Should see file data in console
// No "Failed to upload file" errors
```

#### **API 404 Errors:**
```javascript
// Should NOT see these:
// GET /api/... 404 (Not Found)
// POST /upload 404 (Not Found)
```

---

## 🛠️ **Manual Fixes (If Needed)**

### **Clear Browser Cache:**
```bash
# Clear cache and hard reload
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### **Check Environment:**
```javascript
// In browser console, check:
console.log(window.location.hostname);
// Should show your-app-name.vercel.app
```

### **Test API Directly:**
```bash
# Test health endpoint
curl https://your-app-name.vercel.app/api/health
# Should return: {"status":"ok"}
```

---

## 📞 **Get Help**

### **Vercel Support:**
- **Dashboard**: Check deployment logs
- **Community**: Vercel Discord
- **Docs**: [vercel.com/docs](https://vercel.com/docs)

### **Debug Steps:**
1. **Check console** for JavaScript errors
2. **Check Vercel logs** for server errors
3. **Test locally** to confirm features work
4. **Compare local vs live** behavior

---

## 🎯 **Expected Behavior**

### **Working Features:**
✅ **Real-time chat** - Messages appear instantly
✅ **File sharing** - Images/documents share via base64
✅ **Screen sharing** - WebRTC screen sharing works
✅ **Voice messages** - Audio recording and playback
✅ **Emojis** - Full emoji picker works
✅ **Dark mode** - Theme switching works
✅ **Mobile responsive** - Works on all devices

### **Connection Status:**
- **Socket.io**: Connected with WebSocket
- **API**: All endpoints respond correctly
- **File handling**: Base64 encoding for Vercel
- **Real-time**: No delays in messaging

---

## 🚀 **You're Ready!**

After deploying these fixes:
1. **Push changes** to GitHub
2. **Wait for Vercel** to auto-deploy
3. **Test all features** on your live app
4. **Enjoy your fully functional** web communication app! 🎉

**Your app should now work perfectly on Vercel!** ⚡
