# Web Deployment Plan - Simplest Options

**Date**: 2025-02-01  
**Focus**: Web deployment only (mobile later)  
**Goal**: Easiest deployment path

---

## Option 1: Replit Deployment (EASIEST - Already Configured!)

**Effort**: 30 minutes - 2 hours  
**Cost**: Free tier available, or paid plans

### Current Status
✅ Your `.replit` file already has deployment configuration:
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

### Steps to Deploy on Replit

1. **Verify Environment Variables** (5 minutes)
   - Go to Replit Secrets (lock icon in sidebar)
   - Ensure all required env vars are set:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `PORT` (defaults to 5000)
     - `GOOGLE_CLIENT_ID` (if using Calendar)
     - `GOOGLE_CLIENT_SECRET` (if using Calendar)

2. **Deploy from Replit** (5 minutes)
   - Click "Deploy" button in Replit (or go to Deployments tab)
   - Replit will automatically:
     - Run `npm run build`
     - Start with `npm run start`
     - Provide a public URL

3. **Update OAuth Callback URLs** (10 minutes)
   - Go to Google Cloud Console
   - Update authorized redirect URI to include your Replit deployment URL:
     - `https://your-app-name.replit.app/api/auth/google/callback`

4. **Test** (10 minutes)
   - Visit your deployment URL
   - Test login/signup
   - Test OAuth flow (if using Calendar)
   - Verify all features work

**Total Time**: 30 minutes - 1 hour

### Pros
- ✅ Already configured
- ✅ Zero additional setup
- ✅ Free tier available
- ✅ Automatic SSL
- ✅ Built-in monitoring

### Cons
- ⚠️ Replit-specific domain (unless you add custom domain)
- ⚠️ Free tier has limitations (may spin down after inactivity)

---

## Option 2: Railway (Simple Alternative)

**Effort**: 2-3 hours  
**Cost**: $5-20/month

### Why Railway?
- Very simple setup
- Full-stack support (frontend + Express backend)
- No Dockerfile needed (can auto-detect)
- GitHub integration

### Steps

1. **Create Railway Account** (5 minutes)
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project** (5 minutes)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build** (10 minutes)
   - Railway will auto-detect Node.js
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Set root directory: `/` (root)

4. **Add Environment Variables** (15 minutes)
   - In Railway dashboard, go to Variables tab
   - Add all required env vars (same as Replit)

5. **Deploy** (automatic)
   - Railway will deploy on every push to main branch
   - Or click "Deploy" button

6. **Update OAuth URLs** (10 minutes)
   - Get your Railway URL (e.g., `your-app.up.railway.app`)
   - Update Google OAuth callback URL

**Total Time**: 2-3 hours

### Pros
- ✅ Very simple
- ✅ Full-stack support
- ✅ Custom domain support
- ✅ GitHub integration

### Cons
- ⚠️ Costs money (but reasonable)
- ⚠️ Requires Railway account

---

## Option 3: Render (Similar to Railway)

**Effort**: 2-3 hours  
**Cost**: Free tier (with limitations) or $7-25/month

### Steps

1. **Create Render Account** (5 minutes)
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service** (10 minutes)
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Render will auto-detect Node.js

3. **Configure** (10 minutes)
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment: Node

4. **Add Environment Variables** (15 minutes)
   - Add all required env vars in Render dashboard

5. **Deploy** (automatic)
   - Render deploys on every push

**Total Time**: 2-3 hours

### Pros
- ✅ Free tier available
- ✅ Simple setup
- ✅ Custom domain support

### Cons
- ⚠️ Free tier spins down after inactivity (slow first load)
- ⚠️ Paid tier recommended for production

---

## Recommended Approach

### Phase 1: Quick Deploy (Replit)
**Time**: 30 minutes - 1 hour

1. Use Replit deployment (already configured!)
2. Verify env vars are set
3. Click Deploy
4. Test and verify

### Phase 2: Production (If Needed)
**Time**: 2-3 hours

If you want to move off Replit or need more control:
- Use Railway (recommended for simplicity)
- Or Render (if you want free tier)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in deployment platform
- [ ] `npm run build` works locally (test it!)
- [ ] `npm start` works locally (test it!)
- [ ] OAuth callback URLs updated in Google Cloud Console
- [ ] Edge Functions are deployed to Supabase (already done via GitHub Actions)
- [ ] Database migrations are applied (check Supabase dashboard)

---

## Quick Test Commands

Test locally before deploying:

```bash
# Build
npm run build

# Test production build
npm start

# Should see: "serving on port 5000"
# Visit http://localhost:5000
```

---

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version matches (20+)
- Check build logs for specific errors

### App Doesn't Start
- Verify `PORT` env var is set
- Check that `dist/` folder exists after build
- Verify `dist/index.js` exists

### OAuth Not Working
- Check callback URL matches exactly (including trailing slash)
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check browser console for errors

### Environment Variables Not Working
- Frontend vars must start with `VITE_` (they're baked into build)
- Backend vars are read at runtime
- Rebuild after changing `VITE_*` vars

---

## Next Steps

1. **Choose deployment option** (Replit is easiest!)
2. **Deploy and test**
3. **Update OAuth URLs**
4. **Share the URL!**

---

## Cost Comparison

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Replit** | ✅ Yes | $7/month | Quickest deployment |
| **Railway** | ❌ No | $5-20/month | Simple, reliable |
| **Render** | ✅ Yes* | $7-25/month | Free tier option |

*Render free tier spins down after inactivity

---

**Recommendation**: Start with **Replit** (already configured, 30 min), then move to **Railway** if you need more control or a custom domain.

