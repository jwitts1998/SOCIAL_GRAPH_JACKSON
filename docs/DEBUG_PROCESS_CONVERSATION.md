# Debugging "Process Conversation" Error

## What Happens When You Click "Process Conversation"

1. **extract-entities** - Extracts entities from conversation transcript
2. **generate-matches** - Generates match suggestions (calls embed-conversation-entities if needed)

## Step-by-Step Debugging

### Step 1: Check extract-entities Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **`extract-entities`**
2. Click **"Logs"** tab
3. Filter by **"ERROR"** or **"WARN"** severity
4. Look for the most recent error when you clicked "Process Conversation"

**Common errors:**
- "OPENAI_API_KEY not configured" → Add secret in Edge Functions Settings
- "No transcript found" → Conversation needs transcript segments
- "Unauthorized" → Auth issue

### Step 2: Check generate-matches Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **`generate-matches`**
2. Click **"Logs"** tab
3. Filter by **"ERROR"** or **"WARN"** severity
4. Look for errors related to:
   - Embedding generation
   - Contact fetching
   - GPT API calls

**Look for these log messages:**
- "✅ Using cached conversation embedding" OR "✅ Generated conversation embedding"
- "🔍 Starting semantic pre-filtering with embeddings..."
- "⚠️ Failed to generate embedding" (this is OK, falls back to GPT-only)
- "❌ Error:" (this is the problem)

### Step 3: Check embed-conversation-entities Logs (if called)

1. Go to **Supabase Dashboard** → **Edge Functions** → **`embed-conversation-entities`**
2. Click **"Logs"** tab
3. Check if it's being called and if there are errors

### Step 4: Verify Prerequisites

Run this SQL in Supabase SQL Editor:

```sql
-- Check if conversation has transcript segments
SELECT COUNT(*) as segment_count 
FROM conversation_segments 
WHERE conversation_id = 'YOUR_CONVERSATION_ID';

-- Check if conversation has entities (after extract-entities runs)
SELECT COUNT(*) as entity_count 
FROM conversation_entities 
WHERE conversation_id = 'YOUR_CONVERSATION_ID';

-- Check if conversation has embedding
SELECT entity_embedding IS NOT NULL as has_embedding 
FROM conversations 
WHERE id = 'YOUR_CONVERSATION_ID';
```

### Step 5: Test Functions Individually

**Test extract-entities:**
1. Go to Edge Functions → `extract-entities` → Invoke
2. Body: `{"conversationId": "YOUR_CONVERSATION_ID"}`
3. Check response

**Test generate-matches:**
1. Go to Edge Functions → `generate-matches` → Invoke
2. Body: `{"conversationId": "YOUR_CONVERSATION_ID"}`
3. Check response and logs

## Common Issues and Fixes

### Issue: "OPENAI_API_KEY not configured"
**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Settings (or Secrets)
2. Add secret: `OPENAI_API_KEY` with your OpenAI API key
3. Redeploy functions if needed

### Issue: "No transcript segments found"
**Fix:**
- Make sure the conversation was recorded/transcribed
- Check `conversation_segments` table has data

### Issue: "embed-conversation-entities failed"
**Fix:**
- Verify `embed-conversation-entities` function is deployed
- Check it has `OPENAI_API_KEY` secret
- Check logs for specific error

### Issue: "No contacts found"
**Fix:**
- Make sure you have contacts in your database
- Check contacts have `owned_by_profile` matching your user ID

### Issue: Database column errors
**Fix:**
- Verify `semantic_similarity` column exists in `match_suggestions`
- Verify `entity_embedding` column exists in `conversations`
- Run migrations if needed

## Quick Test

Try processing conversation `b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4` and check:
1. Browser console for client-side errors
2. Edge Function logs for server-side errors
3. Network tab for HTTP status codes

Share the exact error message from the logs!

