# Replit Deployment Checklist

**Quick reference for deploying to Replit production**

---

## Pre-Deployment (Do First!)

- [ ] **Git is clean** - `git status` shows no uncommitted changes
- [ ] **Local build works** - `npm run build` succeeds
- [ ] **Local production works** - `npm start` runs and app loads
- [ ] **Environment variables documented** - List all Replit Secrets

---

## Deployment Steps

### 1. Verify Configuration (5 min)
- [ ] Open `.replit` file - verify deployment section:
  ```toml
  [deployment]
  deploymentTarget = "autoscale"
  build = ["npm", "run", "build"]
  run = ["npm", "run", "start"]
  ```
- [ ] Verify PORT is set (defaults to 5000)

### 2. Check Environment Variables (10 min)
- [ ] Open Replit Secrets (lock icon in sidebar)
- [ ] Verify these are set:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `PORT` (optional, defaults to 5000)
  - [ ] `GOOGLE_CLIENT_ID` (if using Calendar)
  - [ ] `GOOGLE_CLIENT_SECRET` (if using Calendar)

### 3. Deploy (5 min)
- [ ] Click **"Deploy"** button in Replit (or go to Deployments tab)
- [ ] Watch build logs - should see:
  - `npm run build` running
  - Build completing successfully
- [ ] Watch start logs - should see:
  - `npm start` running
  - `serving on port 5000` message
- [ ] Copy deployment URL (e.g., `https://your-app.replit.app`)

### 4. Update OAuth (10 min)
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Navigate to APIs & Services → Credentials
- [ ] Edit your OAuth 2.0 Client
- [ ] Add authorized redirect URI:
  - `https://your-app.replit.app/api/auth/google/callback`
- [ ] Save changes

---

## Post-Deployment Verification

### Basic Health Check
- [ ] Visit deployment URL in browser
- [ ] Verify HTTPS (lock icon in address bar)
- [ ] Home page loads without errors
- [ ] No console errors (check browser DevTools)

### Authentication Test
- [ ] Test user signup
- [ ] Test user login
- [ ] Test user logout
- [ ] Verify protected routes require auth

### Core Features Test
- [ ] Contacts page loads
- [ ] Contact creation works
- [ ] Conversation history loads
- [ ] Any other critical features

### OAuth Test (if applicable)
- [ ] Click "Connect Calendar" (if present)
- [ ] Complete OAuth flow
- [ ] Verify callback works

---

## Troubleshooting

### Build Fails
- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Try `npm install` locally to check for issues

### App Doesn't Start
- Check start logs for errors
- Verify `PORT` env var is set
- Verify `dist/` folder exists after build

### Environment Variables Not Working
- **Frontend vars** (VITE_*) are baked into build - rebuild after changing
- **Backend vars** are read at runtime
- Verify vars are set in Replit Secrets (not .env file)

### OAuth Not Working
- Verify callback URL matches exactly (including https://)
- Check Google Cloud Console → OAuth credentials
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

---

## Rollback (If Needed)

If something goes wrong:

1. **Stop deployment** in Replit Deployments tab
2. **Revert code** (if code changes were made):
   ```bash
   git checkout main
   git reset --hard HEAD~1  # Only if you made commits
   ```
3. **Redeploy** previous working version
4. **Document** what went wrong for next time

---

## Quick Commands

```bash
# Test build locally
npm run build

# Test production locally
npm start

# Check git status
git status

# View Replit logs
# (In Replit, check Deployments tab → Logs)
```

---

## Important Notes

⚠️ **DO NOT:**
- Modify `.replit` file unless absolutely necessary
- Change build/start commands without testing locally first
- Deploy with uncommitted changes
- Skip verification steps

✅ **DO:**
- Test locally first
- Verify environment variables
- Monitor deployment logs
- Test after deployment
- Document any issues

---

## Support

- **Replit Docs**: https://docs.replit.com
- **Deployment Issues**: Check Replit Deployments tab → Logs
- **Environment Variables**: Replit Secrets (lock icon)

---

**Last Updated**: 2025-02-01  
**Task File**: `tasks/03_replit_web_deployment.yml`

