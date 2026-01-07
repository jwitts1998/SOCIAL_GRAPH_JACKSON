# Vercel Deployment Guide

This guide walks through deploying the Social Graph Connector to Vercel.

## Prerequisites

- GitHub repository: `jwitts1998/SOCIAL_GRAPH_JACKSON`
- Vercel account (sign up at [vercel.com](https://vercel.com))
- All required credentials (Supabase, Google OAuth, etc.)

## Pre-Deployment Checklist

### 1. Environment Variables

Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

#### Frontend (Required - Exposed to Browser)
- `VITE_SUPABASE_URL` - Your Supabase project URL
  - Get from: Supabase Dashboard → Settings → API → Project URL
  - Format: `https://xxxxxxxxxxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
  - Get from: Supabase Dashboard → Settings → API → Project API keys → anon public

#### Backend (Required - Server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
  - Get from: Supabase Dashboard → Settings → API → Project API keys → service_role
  - **⚠️ NEVER expose this to the frontend**

#### Google OAuth (Optional - Only needed if using Calendar integration)
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
  - Get from: Google Cloud Console → APIs & Services → Credentials
  - Format: `xxxxxxxxxxxxx.apps.googleusercontent.com`
  - **Note**: Can be omitted if not using Calendar features
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
  - Get from: Google Cloud Console → APIs & Services → Credentials
  - Format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`
  - **Note**: Can be omitted if not using Calendar features

#### DATABASE_URL (Optional - Only needed for local migrations/scripts)
- `DATABASE_URL` - PostgreSQL connection string
  - **Note**: Not required for Vercel deployment
  - Only needed if running migrations locally with Drizzle
  - Format: `postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres`

#### OAuth Callback URL
After deployment, update Google Cloud Console with:
- **Production**: `https://[your-app].vercel.app/api/auth/google/callback`
- **Preview**: `https://[your-app]-[hash].vercel.app/api/auth/google/callback`

### 2. Build Configuration

The project is configured with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Framework**: Vite (auto-detected)

### 3. API Routes

API routes are handled via:
- **Serverless Function**: `api/index.ts`
- **Routes**: `/api/auth/google/*` (OAuth flows)

## Deployment Steps

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import repository: `jwitts1998/SOCIAL_GRAPH_JACKSON`
4. Configure project settings:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist/public` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Step 2: Configure Environment Variables

1. Before deploying, go to **Project Settings → Environment Variables**
2. Add all required variables (see checklist above)
3. Set them for **Production** and **Preview** environments
4. Click **"Save"** for each variable

### Step 3: Deploy

1. Click **"Deploy"** (or it will auto-deploy on git push to `main`)
2. Wait for build to complete
3. Copy the deployment URL (e.g., `your-app.vercel.app`)

### Step 4: Update OAuth Callback URL

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   - Production: `https://[your-app].vercel.app/api/auth/google/callback`
   - Preview (optional): `https://[your-app]-[hash].vercel.app/api/auth/google/callback`
5. Click **"Save"**

### Step 5: Verify Deployment

1. Visit your deployment URL
2. Test authentication (signup/login)
3. Test OAuth flow (if Google Calendar is enabled)
4. Check browser console for errors
5. Verify SSL certificate (Vercel provides this automatically)

## Project Structure for Vercel

```
.
├── api/
│   └── index.ts          # Serverless function for API routes
├── client/               # React frontend
├── server/               # Express backend code
├── dist/
│   ├── public/          # Built frontend (served as static files)
│   └── index.js         # Built server (not used on Vercel)
├── vercel.json          # Vercel configuration
└── package.json
```

## How It Works

1. **Frontend**: Built by Vite → `dist/public/` → Served as static files by Vercel
2. **API Routes**: `/api/*` requests → `api/index.ts` → Express serverless function
3. **Database**: Frontend connects directly to Supabase (no backend needed for most operations)
4. **OAuth**: Handled by Express serverless function at `/api/auth/google/*`

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify `npm run build` works locally
- Check for TypeScript errors: `npm run check`

### Environment Variables Not Working
- Verify variables are set in Vercel Dashboard
- Check variable names match exactly (case-sensitive)
- Ensure `VITE_*` prefix for frontend variables
- Redeploy after adding new variables

### API Routes Not Working
- Check `api/index.ts` is properly exported
- Verify routes are prefixed with `/api/`
- Check function logs in Vercel Dashboard → Functions

### OAuth Callback Fails
- Verify callback URL matches exactly in Google Cloud Console
- Check `VERCEL_URL` environment variable is set (Vercel sets this automatically)
- Ensure OAuth callback URL uses HTTPS (Vercel provides SSL)

### Static Files Not Loading
- Verify `outputDirectory` in `vercel.json` matches build output
- Check `dist/public/` contains built files after build
- Verify `vercel.json` rewrites are configured correctly

## Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Preview deployment

## Custom Domain (Optional)

1. Go to **Project Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

## Monitoring

- **Logs**: View in Vercel Dashboard → Deployments → [Deployment] → Functions
- **Analytics**: Enable in Project Settings → Analytics (paid feature)
- **Metrics**: View in Vercel Dashboard → Analytics tab

## Rollback

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"⋯"** → **"Promote to Production"**

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- Check deployment logs for specific errors

