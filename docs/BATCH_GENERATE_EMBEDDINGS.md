# Batch Generate Embeddings for Contacts

This guide explains how to batch generate embeddings for all your contacts.

## Option 1: Using Browser Console (Recommended - Easiest)

**This is the recommended method** because you're already authenticated in your browser.

1. Open your app in the browser (where you're logged in)
2. Open Developer Console (F12 or Cmd+Option+I on Mac)
3. Paste and run this code:

```javascript
async function batchGenerateEmbeddings() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  let totalProcessed = 0;
  let batchNumber = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`📦 Processing batch ${batchNumber}...`);
    
    const { data, error } = await supabase.functions.invoke('embed-contacts', {
      body: { mode: 'batch' }
    });
    
    if (error) {
      console.error('❌ Error:', error);
      break;
    }
    
    const processed = data.processed || 0;
    const total = data.total || 0;
    hasMore = data.hasMore === true;
    
    totalProcessed += processed;
    console.log(`✅ Processed ${processed}/${total} contacts (${totalProcessed} total)`);
    
    if (hasMore) {
      batchNumber++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`🎉 Complete! Processed ${totalProcessed} contacts total.`);
}

batchGenerateEmbeddings();
```

This will automatically use your current browser session for authentication.

## Option 2: Using Supabase Dashboard (Requires Auth Token)

⚠️ **Note**: The Dashboard test interface doesn't automatically include user authentication. You need to manually add your auth token.

1. Get your auth token from browser localStorage:
   - Open browser console on your app
   - Run: `JSON.parse(localStorage.getItem('sb-' + location.hostname.split('.')[0] + '-auth-token'))?.access_token`
   - Copy the token

2. Go to **Supabase Dashboard** → **Edge Functions** → **embed-contacts**
3. Click **"Invoke Function"**
4. Set the body to:
   ```json
   {
     "mode": "batch"
   }
   ```
5. **Add Header**:
   - Key: `Authorization`
   - Value: `Bearer YOUR_AUTH_TOKEN_HERE`
6. Click **"Invoke"**
7. Repeat until `hasMore: false` in the response

## Option 3: Using curl (Advanced)

1. Open your app in the browser
2. Open Developer Console (F12)
3. Run this code:

```javascript
async function batchGenerateEmbeddings() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  let totalProcessed = 0;
  let batchNumber = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`📦 Processing batch ${batchNumber}...`);
    
    const { data, error } = await supabase.functions.invoke('embed-contacts', {
      body: { mode: 'batch' }
    });
    
    if (error) {
      console.error('❌ Error:', error);
      break;
    }
    
    const processed = data.processed || 0;
    const total = data.total || 0;
    hasMore = data.hasMore === true;
    
    totalProcessed += processed;
    console.log(`✅ Processed ${processed}/${total} contacts (${totalProcessed} total)`);
    
    if (hasMore) {
      batchNumber++;
      await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
    }
  }
  
  console.log(`🎉 Complete! Processed ${totalProcessed} contacts total.`);
}

batchGenerateEmbeddings();
```

## Option 3: Using curl (Advanced)

1. Get your Supabase anon key from `.env` or Supabase Dashboard
2. Get your session token (from browser localStorage or Supabase auth)
3. Run:

```bash
curl -X POST \
  "https://YOUR_PROJECT.supabase.co/functions/v1/embed-contacts" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"mode": "batch"}'
```

Repeat until `hasMore: false`.

## What Gets Embedded?

- **bio_embedding**: Generated from `bio` + `title` + `company` (if available)
- **thesis_embedding**: Generated from `investor_notes` (if available)

Contacts without `bio` or `investor_notes` won't get embeddings, which is expected. They'll still be matched via GPT scoring.

## Processing Details

- Processes **50 contacts per batch**
- Rate limited: 100ms delay between contacts
- Continues until all contacts with available data are processed
- Shows progress and any errors

## Expected Time

- ~50 contacts per minute (due to rate limiting)
- For 200 contacts: ~4 minutes
- For 1000 contacts: ~20 minutes

