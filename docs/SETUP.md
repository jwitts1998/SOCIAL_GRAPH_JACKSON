# Setup Guide - Getting Your Credentials

This guide walks you through obtaining all the credentials needed to run the Social Graph Connector application.

## Prerequisites

Before you begin, make sure you have:
- Node.js 20+ installed
- A GitHub account (for Supabase sign-up)
- An email address

---

## Step 1: Supabase Setup (Required)

Supabase provides the database, authentication, and serverless functions for this app.

### 1.1 Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

### 1.2 Create a New Project

1. Click **"New Project"** in the Supabase dashboard
2. Fill in:
   - **Name**: `social-graph-connector` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

### 1.3 Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API** (in the left sidebar)
2. You'll see two important values:

   **Project URL** (this is your `VITE_SUPABASE_URL`):
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Scroll down to find **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`):
   - ⚠️ **Keep this secret!** Never expose it to the frontend
   - Only use in backend/Edge Functions

### 1.4 Set Up Database

1. Go to **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy the contents of `supabase/migrations/20250101000000_initial_schema.sql`
4. Paste and click **"Run"**
5. Wait for migration to complete (creates all tables)

**OR** use the CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>
# Find project-ref in your dashboard URL: https://supabase.com/dashboard/project/<PROJECT-REF>

# Push migrations
supabase db push
```

---

## Step 2: OpenAI API Key (Required for AI Features)

OpenAI powers transcription, entity extraction, and match generation.

### 2.1 Create OpenAI Account

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Click **"Sign up"** or **"Log in"**
3. Complete account setup (may require phone verification)

### 2.2 Get API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Name it: `social-graph-connector`
4. **Copy the key immediately** (you won't see it again!)
   ```
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Click **"Create secret key"**

### 2.3 Add Credits (If Needed)

- Free tier: $5 credit to start
- Go to [Billing](https://platform.openai.com/account/billing) to add more
- Recommended: Start with $10-20 for testing

### 2.4 Set in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Click **"Add new secret"**
4. Name: `OPENAI_API_KEY`
5. Value: Paste your OpenAI API key
6. Click **"Save"**

---

## Step 3: Google OAuth (Optional - for Calendar Integration)

Only needed if you want Google Calendar sync.

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Name: `Social Graph Connector`
4. Click **"Create"**

### 3.2 Enable Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click **"Enable"**

### 3.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - **User Type**: External
   - **App name**: Social Graph Connector
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Scopes: Add `https://www.googleapis.com/auth/calendar.readonly`
   - Test users: Add your email
   - Click **"Save and Continue"**
4. Back to credentials:
   - **Application type**: Web application
   - **Name**: Social Graph Connector Web Client
   - **Authorized redirect URIs**: 
     - For local dev: `http://localhost:5000/api/auth/google/callback`
     - For Replit: `https://<your-replit-domain>/api/auth/google/callback`
   - Click **"Create"**
5. **Copy the Client ID and Client Secret**:
   ```
   Client ID: xxxxxxxxxxxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 4: Optional API Keys

### 4.1 Hunter.io (Contact Enrichment)

1. Go to [https://hunter.io](https://hunter.io)
2. Sign up for free account (50 requests/month)
3. Go to **Dashboard** → **API**
4. Copy your **API Key**
5. Add to Supabase Edge Functions Secrets as `HUNTER_API_KEY`

### 4.2 People Data Labs (Contact Enrichment)

1. Go to [https://www.peopledatalabs.com](https://www.peopledatalabs.com)
2. Sign up for free account
3. Go to **Dashboard** → **API Key**
4. Copy your **API Key**
5. Add to Supabase Edge Functions Secrets as `PDL_API_KEY`

---

## Step 5: Configure Environment Variables

### For Local Development

Create a `.env` file in the project root:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=5000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx

# Legacy (for Drizzle, optional)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**Note**: Never commit `.env` to git!

### For Replit

1. Go to your Replit project
2. Click the **Secrets** tab (lock icon in sidebar)
3. Add each variable:
   - Click **"New secret"**
   - Key: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL
   - Click **"Add secret"**
4. Repeat for all required variables

### For Supabase Edge Functions

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add secrets:
   - `OPENAI_API_KEY` (required)
   - `HUNTER_API_KEY` (optional)
   - `PDL_API_KEY` (optional)

---

## Step 6: Verify Setup

### 6.1 Test Supabase Connection

```bash
npm run dev
```

Open browser console - you should NOT see:
```
⚠️ Supabase credentials not configured properly.
```

### 6.2 Test Database

1. Go to Supabase Dashboard → **Table Editor**
2. You should see tables: `profiles`, `contacts`, `conversations`, etc.
3. If tables are missing, run migrations (see Step 1.4)

### 6.3 Test Edge Functions

1. Go to Supabase Dashboard → **Edge Functions**
2. You should see functions: `transcribe-audio`, `extract-entities`, etc.
3. If missing, deploy them:
   ```bash
   supabase functions deploy transcribe-audio
   supabase functions deploy extract-entities
   # ... deploy all functions
   ```

---

## Troubleshooting

### "Supabase credentials not configured"
- Check `.env` file exists and has correct variable names
- Restart dev server after adding env vars
- For Replit: Check Secrets tab has all required variables

### "Database connection failed"
- Verify `VITE_SUPABASE_URL` is correct (no trailing slash)
- Check Supabase project is active (not paused)
- Verify database password is correct

### "OpenAI API error"
- Check API key is set in Supabase Edge Functions Secrets
- Verify you have credits in OpenAI account
- Check API key hasn't been revoked

### "Google OAuth error"
- Verify redirect URI matches exactly (including http/https)
- Check OAuth consent screen is configured
- Ensure test users are added (for development)

---

## Quick Reference

| Credential | Where to Get | Where to Set |
|------------|--------------|--------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API | `.env` or Replit Secrets |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | `.env` or Replit Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | `.env` or Replit Secrets |
| `OPENAI_API_KEY` | OpenAI Platform → API Keys | Supabase Edge Functions Secrets |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | `.env` or Replit Secrets |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | `.env` or Replit Secrets |

---

## Next Steps

Once credentials are set up:
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start the app
3. Go to `http://localhost:5000` in your browser
4. Sign up for a new account
5. Start using the app!

For more details, see:
- [README.md](../README.md) - Quick start guide
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) - Database setup details
- [docs/INDEX_FOR_AI.md](./INDEX_FOR_AI.md) - Development guide

