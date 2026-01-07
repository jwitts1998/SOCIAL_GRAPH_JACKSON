# Debugging "Process Conversation" Error

## What "Process Conversation" Does

When you click "Process Conversation", it:
1. Calls `extract-entities` Edge Function
2. Calls `generate-matches` Edge Function (this is likely where it's failing)

## Where to Find the Error

### Step 1: Check generate-matches Logs

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **`generate-matches`** function
3. Click on **"Logs"** tab
4. Look for the most recent error (red text)
5. Scroll to see the full error message

### Step 2: Check extract-entities Logs (if needed)

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **`extract-entities`** function
3. Click on **"Logs"** tab
4. Check if there are any errors

## Common Errors

### Error: "OPENAI_API_KEY not configured"
**Cause**: The Edge Function doesn't have the OpenAI API key set as a secret.

**Solution**:
1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** (or **Secrets**)
2. Look for `OPENAI_API_KEY` in the secrets list
3. If missing, add it:
   - Click "Add new secret" or "Add secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Click "Save"

### Error: "Failed to generate embedding" or "embed-conversation-entities failed"
**Cause**: The `embed-conversation-entities` function is failing when called from `generate-matches`.

**Possible reasons**:
- `embed-conversation-entities` function not deployed
- Missing `OPENAI_API_KEY` in `embed-conversation-entities` function
- No entities extracted yet (need to run `extract-entities` first)

**Solution**:
1. Make sure `extract-entities` runs successfully first
2. Check that `embed-conversation-entities` function is deployed
3. Verify `OPENAI_API_KEY` is set in Edge Function secrets

### Error: "Unauthorized"
**Cause**: Authentication issue.

**Solution**: Make sure you're logged into the app.

### Error: Database/Column errors
**Cause**: Missing database columns or RLS issues.

**Solution**: 
- Verify `semantic_similarity` column exists in `match_suggestions` table
- Verify `entity_embedding` column exists in `conversations` table
- Run migrations if needed

## Quick Fix: Check Function Deployment

Make sure all functions are deployed:

```bash
supabase functions deploy generate-matches
supabase functions deploy extract-entities
supabase functions deploy embed-conversation-entities
```

## Test Individual Functions

You can test each function separately in the Supabase Dashboard:

1. **Test extract-entities**:
   - Go to Edge Functions → `extract-entities` → Invoke
   - Body: `{"conversationId": "YOUR_CONVERSATION_ID"}`
   - Check if it succeeds

2. **Test generate-matches**:
   - Go to Edge Functions → `generate-matches` → Invoke
   - Body: `{"conversationId": "YOUR_CONVERSATION_ID"}`
   - Check the error message

## Most Likely Issue

Based on the recent changes, the most likely issue is:
- **Missing `OPENAI_API_KEY` secret** in Edge Functions
- **`embed-conversation-entities` function not deployed** or failing

Check the logs and share the exact error message!

