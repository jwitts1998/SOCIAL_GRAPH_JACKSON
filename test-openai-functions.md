# Testing OpenAI Edge Functions

## ✅ Status Check

From your Supabase Dashboard:
- ✅ All 8 Edge Functions are deployed
- ✅ `OPENAI_API_KEY` is set in Edge Functions Secrets
- ✅ Functions are accessible at: `https://mtelyxosqqaeadrrrtgk.supabase.co/functions/v1/`

## 🔍 What I Notice

**Good:**
- All required functions are deployed
- Some functions have recent deployments (extract-entities: 17 deployments, generate-matches: 23 deployments)

**Potential Issues:**
- Some functions haven't been updated in 2 months (transcribe-audio, extract-participants, process-participants, sync-google-calendar)
- These might need redeployment if code has changed

## 🧪 Test Options

### Option 1: Test via App UI (Easiest)

1. **Open your app**: http://localhost:5001
2. **Sign up/Login** if needed
3. **Go to Record page** (or wherever recording is)
4. **Record a short conversation** (10-30 seconds)
5. **Watch the console** for:
   - Transcription happening
   - Entities being extracted
   - Participants being identified
   - Matches being generated

6. **Check Supabase Dashboard → Edge Functions → Logs** to see function execution

### Option 2: Test Directly via API (Quick Verification)

Test `extract-entities` function directly (requires a conversation with segments):

```bash
# First, get your auth token from the app (check browser console after login)
# Then test the function:

curl -X POST \
  'https://mtelyxosqqaeadrrrtgk.supabase.co/functions/v1/extract-entities' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"conversationId": "YOUR_CONVERSATION_ID"}'
```

### Option 3: Check Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on any function (e.g., `extract-entities`)
3. Go to **Logs** tab
4. Look for recent executions and any errors

## 🎯 Recommended Test Flow

1. **Start the app**: http://localhost:5001
2. **Create a test account** (if needed)
3. **Add a test contact** (so matches can be generated)
4. **Record a short conversation** mentioning:
   - An investment stage (e.g., "pre-seed", "seed")
   - A sector (e.g., "fintech", "SaaS")
   - A check size (e.g., "$500k", "$1M")
5. **Watch for**:
   - Real-time transcription appearing
   - Entities being extracted
   - Matches being generated

## 🔧 If Functions Fail

Check Supabase Dashboard → Edge Functions → Logs for:
- "OPENAI_API_KEY not configured" → Secret not set (but it is, so this shouldn't happen)
- "401 Unauthorized" → OpenAI API key invalid
- "429 Too Many Requests" → Rate limit hit
- "500 Internal Server Error" → Check logs for details

## 📊 Function Dependencies

The functions work in this order:
1. `transcribe-audio` → Creates conversation segments
2. `extract-entities` → Extracts investment criteria from segments
3. `extract-participants` → Identifies people in conversation
4. `process-participants` → Processes participant data
5. `generate-matches` → Matches contacts to entities
6. `generate-intro-email` → Creates intro emails (when requested)

## 🚀 Quick Test Script

If you want, I can create a simple test script that:
1. Creates a test conversation
2. Adds some test segments
3. Calls extract-entities
4. Verifies OpenAI is working

Would you like me to create that?

