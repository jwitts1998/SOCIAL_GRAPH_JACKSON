# Local Setup Guide - Step by Step

This guide will help you get the Social Graph Connector running on your Mac or iPhone.

## Prerequisites Check ✅

- ✅ Node.js 20.19.4 installed
- ✅ npm 10.8.2 installed  
- ✅ Dependencies already installed

## Step 1: Create Environment Variables File

Create a `.env` file in the project root with the following structure:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=5000

# Google OAuth (Optional - only needed for Calendar integration)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**⚠️ Important**: Never commit the `.env` file to git!

## Step 2: Set Up Supabase

### 2.1 Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub (recommended) or email
4. Click **"New Project"**
5. Fill in:
   - **Name**: `social-graph-connector` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
6. Click **"Create new project"**
7. Wait 2-3 minutes for project to initialize

### 2.2 Get Your Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

3. Update your `.env` file with these values

### 2.3 Set Up Database Schema

You have two options:

**Option A: Using Supabase Dashboard (Easier)**
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. We'll need to check which migration files exist and run them

**Option B: Using Supabase CLI (Advanced)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>
# Find project-ref in your dashboard URL: https://supabase.com/dashboard/project/<PROJECT-REF>

# Push migrations
supabase db push
```

## Step 3: Set Up OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Name it: `social-graph-connector`
6. **Copy the key immediately** (you won't see it again!)
7. In Supabase Dashboard:
   - Go to **Edge Functions** → **Secrets**
   - Click **"Add new secret"**
   - Name: `OPENAI_API_KEY`
   - Value: Paste your OpenAI API key
   - Click **"Save"**

## Step 4: Deploy Edge Functions

The app uses Supabase Edge Functions for AI operations. You need to deploy them:

```bash
# Make sure you're in the project directory
cd /Users/jacksonwittenberg/dev/projects/Social_Graph_Jackson

# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Deploy all Edge Functions
supabase functions deploy transcribe-audio
supabase functions deploy extract-entities
supabase functions deploy extract-participants
supabase functions deploy process-participants
supabase functions deploy generate-matches
supabase functions deploy generate-intro-email
supabase functions deploy enrich-contact
supabase functions deploy sync-google-calendar
```

## Step 5: Run the Application

1. Make sure your `.env` file is set up with Supabase credentials
2. Start the development server:

```bash
npm run dev
```

3. The app should start on `http://localhost:5000`
4. Open your browser and navigate to `http://localhost:5000`

## Step 6: Test the Application

1. You should see the login/signup page
2. Create a new account
3. You should be able to access the main dashboard

## Running on iPhone

To run on your iPhone, you have a few options:

### Option 1: Use Local Network (Same WiFi)
1. Find your Mac's local IP address:
   ```bash
   ipconfig getifaddr en0
   ```
2. Update your `.env` to allow external connections (if needed)
3. On your iPhone, open Safari and go to: `http://YOUR_MAC_IP:5000`
   - Example: `http://192.168.1.100:5000`

### Option 2: Use ngrok (Recommended for Development)
1. Install ngrok: `brew install ngrok` or download from [ngrok.com](https://ngrok.com)
2. Start ngrok:
   ```bash
   ngrok http 5000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Open that URL on your iPhone

### Option 3: Deploy to Production
Deploy to a hosting service (Vercel, Netlify, etc.) for a permanent URL.

## Troubleshooting

### "Supabase credentials not configured"
- Check that `.env` file exists in project root
- Verify variable names are correct (must start with `VITE_` for frontend vars)
- Restart the dev server after adding env vars

### "Database connection failed"
- Verify `VITE_SUPABASE_URL` is correct (no trailing slash)
- Check Supabase project is active (not paused)
- Verify you've run the database migrations

### "OpenAI API error"
- Check API key is set in Supabase Edge Functions Secrets
- Verify you have credits in OpenAI account
- Check API key hasn't been revoked

### Port already in use
- Change `PORT` in `.env` to a different port (e.g., `5001`)
- Or kill the process using port 5000:
  ```bash
  lsof -ti:5000 | xargs kill
  ```

## Next Steps

Once the app is running:
1. Sign up for a new account
2. Add some contacts
3. Try recording a conversation
4. Test the matching features

For more details, see:
- [docs/SETUP.md](docs/SETUP.md) - Detailed credential setup
- [docs/INDEX_FOR_AI.md](docs/INDEX_FOR_AI.md) - Development guide

