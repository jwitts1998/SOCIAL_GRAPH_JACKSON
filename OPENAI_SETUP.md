# OpenAI Features Setup Guide

## ✅ Already Configured

From your Supabase Dashboard, I can see that **`OPENAI_API_KEY` is already set** in Edge Functions Secrets.

## OpenAI-Powered Features

Your app uses OpenAI in **5 Edge Functions**:

### 1. **transcribe-audio** 🎤
- **Model**: Whisper-1
- **Purpose**: Converts audio recordings to text transcripts
- **Used when**: User records a conversation

### 2. **extract-entities** 🔍
- **Model**: GPT-3.5-turbo
- **Purpose**: Extracts investment criteria from conversation transcripts
  - Investment stages (pre-seed, seed, Series A, etc.)
  - Sectors/verticals (B2B SaaS, fintech, healthcare, etc.)
  - Check sizes ($1M, $5M, etc.)
  - Geography
- **Used when**: After recording, extracts what the conversation was about

### 3. **extract-participants** 👥
- **Model**: GPT-4
- **Purpose**: Identifies conversation participants and extracts their info
  - Names, emails, companies, titles
  - LinkedIn URLs, locations
  - Key topics discussed
- **Used when**: After recording, identifies who was in the conversation

### 4. **generate-matches** 🎯
- **Model**: GPT-3.5-turbo
- **Purpose**: Matches contacts from your database to conversation entities
  - Scores contacts 1-3 stars based on relevance
  - Provides match reasons
- **Used when**: After extracting entities, finds relevant contacts

### 5. **generate-intro-email** ✉️
- **Model**: GPT-4
- **Purpose**: Generates double opt-in introduction emails
  - Professional, warm tone
  - Includes conversation context
  - Asks for permission to make intro
- **Used when**: User wants to send an introduction

## Next Step: Deploy Edge Functions

The OpenAI API key is set, but you need to **deploy the Edge Functions** to Supabase.

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref mtelyxosqqaeadrrrtgk
   ```

4. **Deploy all Edge Functions**:
   ```bash
   supabase functions deploy transcribe-audio
   supabase functions deploy extract-entities
   supabase functions deploy extract-participants
   supabase functions deploy process-participants
   supabase functions deploy generate-matches
   supabase functions deploy generate-intro-email
   supabase functions deploy enrich-contact
   supabase functions deploy sync-google-calendar
   ```

### Option 2: Check if Already Deployed

Go to your Supabase Dashboard → **Edge Functions** and see if the functions are listed there. If they are, they're already deployed!

### Option 3: Deploy via Supabase Dashboard

You can also deploy Edge Functions manually through the Supabase Dashboard UI, but using the CLI is easier for multiple functions.

## Verify Deployment

After deploying, you should be able to:
1. Record a conversation (uses `transcribe-audio`)
2. See entities extracted (uses `extract-entities`)
3. See participants identified (uses `extract-participants`)
4. See matches generated (uses `generate-matches`)
5. Generate intro emails (uses `generate-intro-email`)

## Cost Estimates

OpenAI API costs (approximate):
- **Whisper-1**: ~$0.006 per minute of audio
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (cheaper)
- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens (more expensive)

For a typical conversation:
- 10-minute recording: ~$0.06 (Whisper)
- Entity extraction: ~$0.01 (GPT-3.5)
- Participant extraction: ~$0.10 (GPT-4)
- Match generation: ~$0.02 (GPT-3.5)
- Email generation: ~$0.15 (GPT-4)

**Total per conversation**: ~$0.30-0.50 (depending on length)

## Troubleshooting

### "OPENAI_API_KEY not configured"
- ✅ Already configured in Supabase Dashboard → Edge Functions → Secrets

### "Function not found" or "Function failed"
- Check if Edge Functions are deployed
- Check Supabase Dashboard → Edge Functions → Logs for errors
- Verify OpenAI API key has credits available

### "OpenAI API error: 401"
- API key might be invalid or revoked
- Check OpenAI Dashboard → API Keys to verify key is active
- Regenerate key if needed and update in Supabase Secrets

### "OpenAI API error: 429" (Rate limit)
- You've hit OpenAI rate limits
- Wait a few minutes and try again
- Consider upgrading OpenAI plan for higher limits

## Testing

To test OpenAI features:
1. Go to your app at http://localhost:5001
2. Sign up/login
3. Try recording a conversation
4. Check Supabase Dashboard → Edge Functions → Logs to see function execution

