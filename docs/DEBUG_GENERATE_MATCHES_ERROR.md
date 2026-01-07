# Debugging generate-matches Error

## What We Know

✅ **extract-entities** is working:
- "Inserted entities: 18"
- "Saved rich context to conversation"
- No errors in extract-entities logs

❌ **generate-matches** is failing (or not being called)

## Step-by-Step Debugging

### Step 1: Check Browser Console

1. Open your app → conversation page
2. Open Developer Console (F12)
3. Click "Process Conversation"
4. Look for red errors
5. **Copy the exact error message**

### Step 2: Check generate-matches Logs for Errors

1. Go to **Supabase Dashboard** → **Edge Functions** → **`generate-matches`**
2. Click **"Logs"** tab
3. **Filter by "ERROR" severity** (use the Severity dropdown)
4. Look for the most recent error when you clicked "Process Conversation"
5. **Copy the exact error message**

### Step 3: Check generate-matches Invocations

1. Go to **Supabase Dashboard** → **Edge Functions** → **`generate-matches`**
2. Click **"Invocations"** tab
3. Find the most recent invocation
4. Check:
   - Status (Success/Failed)
   - Response body
   - Error message (if failed)

### Step 4: Verify generate-matches is Being Called

Check browser console for:
- "🎯 Generating matches..." (should appear)
- "✅ Match generation response:" (should appear if successful)
- "❌ Generate matches error:" (will appear if it fails)

## Common Issues

### Issue: "embed-conversation-entities failed"
**Check**: 
- Is `embed-conversation-entities` function deployed? ✅ (we deployed it)
- Does it have `OPENAI_API_KEY` secret? (check Edge Functions → Settings)

### Issue: "No contacts found"
**Check**:
- Do you have contacts in your database?
- Run: `SELECT COUNT(*) FROM contacts WHERE owned_by_profile = auth.uid();`

### Issue: "OPENAI_API_KEY not configured"
**Fix**:
- Go to Edge Functions → Settings → Secrets
- Add `OPENAI_API_KEY` if missing

### Issue: Database column errors
**Check**:
- `semantic_similarity` column exists in `match_suggestions`? ✅ (we added it)
- `entity_embedding` column exists in `conversations`? ✅ (we added it)

### Issue: Timeout
**Check**:
- Are you processing a very long conversation?
- Check function execution time in Invocations tab

## Quick Test

Try invoking generate-matches directly:

1. Go to **Edge Functions** → **`generate-matches`** → **Invoke**
2. Body: `{"conversationId": "b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4"}`
3. Add Header: `Authorization: Bearer YOUR_AUTH_TOKEN`
4. Click **Invoke**
5. Check the response and logs

## What to Share

Please share:
1. **Browser console error** (exact message)
2. **generate-matches logs** (filter by ERROR, copy the error)
3. **generate-matches invocation status** (Success/Failed, response body)

This will help identify exactly where it's failing!

