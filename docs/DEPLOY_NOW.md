# 🚀 Deploy to Replit - Step by Step

**Status**: ✅ Ready to Deploy  
**Commit**: `9b9c8e7` - All changes committed  
**Port Note**: You're using port 5001 locally, but deployment will use PORT env var (defaults to 5000)

---

## Quick Deployment Steps

### Step 1: Open Replit (2 minutes)

1. Go to [replit.com](https://replit.com) and open your project
2. Make sure you're on the `main` branch (or pull latest changes if needed)

### Step 2: Verify Environment Variables (1 minute)

1. Click the **lock icon** (🔒) in the left sidebar (Secrets)
2. Verify these are set:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `PORT` (optional - defaults to 5000 if not set)

**Note**: If you want to use port 5001 in production, set `PORT=5001` in Secrets. Otherwise, it will use 5000.

### Step 3: Deploy! (5 minutes)

1. Click the **"Deploy"** button in Replit (usually in the top bar, or go to **Deployments** tab)
2. **Watch the logs** - You should see:
   ```
   Running: npm run build
   ```
   Then:
   ```
   Running: npm start
   serving on port 5000
   ```
3. **Copy the deployment URL** - It will look like:
   - `https://your-app-name.replit.app`
   - Or similar Replit domain

### Step 4: Update OAuth Callback (10 minutes)

If you're using Google Calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-deployment-url.replit.app/api/auth/google/callback
   ```
   (Replace `your-deployment-url` with your actual deployment URL)
5. Click **Save**

### Step 5: Test Deployment (5 minutes)

1. **Visit your deployment URL** in a browser
2. **Check HTTPS** - Should see lock icon 🔒
3. **Test Home Page** - Should load without errors
4. **Test Authentication**:
   - Try signing up with a new account
   - Try logging in
   - Verify protected routes work
5. **Test Core Features**:
   - Contacts page
   - Conversation history
   - Any other critical features

---

## What to Watch For

### ✅ Success Indicators
- Build completes without errors
- Server starts with "serving on port 5000" (or your PORT)
- Deployment URL is accessible
- App loads in browser
- No console errors

### ⚠️ Common Issues

**Build Fails:**
- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Try `npm install` in Replit shell first

**App Doesn't Start:**
- Check start logs for errors
- Verify `PORT` env var is set (or defaults to 5000)
- Verify `dist/` folder exists after build

**Environment Variables Not Working:**
- **Frontend vars** (VITE_*) are baked into build - rebuild after changing
- **Backend vars** are read at runtime
- Make sure vars are in Replit Secrets, not `.env` file

**OAuth Not Working:**
- Verify callback URL matches exactly (including `https://`)
- Check Google Cloud Console → OAuth credentials
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

---

## Deployment Configuration

Your `.replit` file is already configured:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

This means Replit will:
1. Run `npm run build` (creates `dist/` folder)
2. Run `npm start` (starts production server)
3. Serve on the port specified by `PORT` env var (or 5000)

---

## After Deployment

### Monitor Logs
- Go to **Deployments** tab in Replit
- Click on your deployment
- View **Logs** to see real-time output

### Update Documentation
- Update `docs/DEPLOYMENT_STATUS.md` with your deployment URL
- Document any issues encountered

### Next Steps
- Set up custom domain (optional)
- Set up monitoring/alerts (optional)
- Test all features thoroughly

---

## Quick Reference

**Deployment URL Format**: `https://your-app-name.replit.app`  
**Port**: Uses `PORT` env var (defaults to 5000)  
**Build Time**: ~2-3 minutes  
**Start Time**: ~5-10 seconds  

---

## Need Help?

- **Replit Docs**: https://docs.replit.com/hosting/deployments
- **Check Logs**: Replit → Deployments → Your Deployment → Logs
- **Environment Variables**: Replit → Secrets (lock icon)

---

**Ready?** Go to Replit and click **Deploy**! 🚀

