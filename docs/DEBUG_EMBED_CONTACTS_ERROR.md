# Debugging embed-contacts Error

## Where to Find Logs

### Option 1: Supabase Dashboard (Easiest)

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **`embed-contacts`** function
3. Click on **"Logs"** tab
4. Look for recent error messages (they'll be in red)

### Option 2: Check Function Invocation

1. Go to **Supabase Dashboard** → **Edge Functions** → **`embed-contacts`**
2. Click on **"Invocations"** tab
3. Find the most recent failed invocation
4. Click on it to see the error details

## Common Errors and Solutions

### Error: "Unauthorized"
**Cause**: The function requires user authentication, but the auth token wasn't passed correctly.

**Solution**: Make sure you're logged into your app when running the script. The Supabase client should automatically include your session token.

### Error: "OPENAI_API_KEY not configured"
**Cause**: The Edge Function doesn't have the OpenAI API key set as a secret.

**Solution**:
1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** (or **Secrets**)
2. Add secret: `OPENAI_API_KEY` with your OpenAI API key value
3. Redeploy the function if needed

### Error: "Contact not found" or Database errors
**Cause**: Database connection issues or RLS policy blocking access.

**Solution**: Check that:
- The function has access to the database
- RLS policies allow the service role to read/write contacts
- The `bio_embedding` and `thesis_embedding` columns exist (run the migration if not)

### Error: "Failed to generate embedding"
**Cause**: OpenAI API call failed (rate limit, invalid key, network issue).

**Solution**: 
- Check OpenAI API key is valid
- Check you haven't hit rate limits
- Check OpenAI account has credits

## Quick Check Script

Run this in your browser console to test the function:

```javascript
(async function() {
  const SUPABASE_URL = 'YOUR_URL';
  const SUPABASE_KEY = 'YOUR_KEY';
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Test with a single contact first
  const { data, error } = await supabase.functions.invoke('embed-contacts', {
    body: { 
      contactId: 'SOME_CONTACT_ID', // Use a real contact ID
      mode: 'single' 
    }
  });
  
  console.log('Response:', data);
  console.log('Error:', error);
})();
```

## Check Function Status

1. Go to **Supabase Dashboard** → **Edge Functions** → **`embed-contacts`**
2. Verify the function is **deployed** and **active**
3. Check the **"Settings"** tab for required secrets:
   - `OPENAI_API_KEY` (required)
   - `SUPABASE_URL` (usually auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (usually auto-set)

