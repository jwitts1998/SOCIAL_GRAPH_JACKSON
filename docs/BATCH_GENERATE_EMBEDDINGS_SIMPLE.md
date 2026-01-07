# Simple Browser Console Script for Batch Embeddings

## Step-by-Step Instructions

1. **Open your app** in the browser (make sure you're logged in)

2. **Open Developer Console**:
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - **Firefox**: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

3. **If you see a warning about pasting code**, type this first and press Enter:
   ```
   allow pasting
   ```

4. **Copy and paste this entire code block** into the console and press Enter:

```javascript
(async function() {
  // Get Supabase URL and key from the page
  const scripts = Array.from(document.querySelectorAll('script'));
  let supabaseUrl = null;
  let supabaseKey = null;
  
  // Try to find from window object or environment
  if (window.__SUPABASE_URL__) {
    supabaseUrl = window.__SUPABASE_URL__;
    supabaseKey = window.__SUPABASE_ANON_KEY__;
  }
  
  // If not found, try to get from network requests or ask user
  if (!supabaseUrl) {
    // Check localStorage for Supabase config
    const keys = Object.keys(localStorage);
    const supabaseKey = keys.find(k => k.includes('supabase') && k.includes('auth-token'));
    
    if (supabaseKey) {
      const tokenData = JSON.parse(localStorage.getItem(supabaseKey));
      if (tokenData) {
        // Extract URL from token storage key
        const projectRef = supabaseKey.split('-')[1];
        supabaseUrl = `https://${projectRef}.supabase.co`;
      }
    }
  }
  
  // If still not found, prompt user
  if (!supabaseUrl) {
    supabaseUrl = prompt('Enter your Supabase URL (e.g., https://xxxxx.supabase.co):');
    supabaseKey = prompt('Enter your Supabase Anon Key (from .env file):');
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  // Import Supabase client
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🚀 Starting batch embedding generation...\n');
  
  let totalProcessed = 0;
  let batchNumber = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`📦 Processing batch ${batchNumber}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('embed-contacts', {
        body: { mode: 'batch' }
      });
      
      if (error) {
        console.error('❌ Error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        break;
      }
      
      if (!data) {
        console.error('❌ No data returned');
        break;
      }
      
      const processed = data.processed || 0;
      const total = data.total || 0;
      hasMore = data.hasMore === true;
      
      totalProcessed += processed;
      console.log(`✅ Processed ${processed}/${total} contacts (${totalProcessed} total)`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn(`⚠️  ${data.errors.length} errors occurred`);
        data.errors.slice(0, 3).forEach(err => console.warn('   -', err));
      }
      
      if (hasMore) {
        batchNumber++;
        console.log('   ⏳ Waiting 1 second before next batch...\n');
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log(`\n🎉 Complete! Processed ${totalProcessed} contacts total.`);
      }
    } catch (err) {
      console.error('❌ Fatal error:', err);
      break;
    }
  }
})();
```

## Alternative: Get Credentials from Network Tab

If the above doesn't work, you can get your credentials from the browser:

1. Open **Network** tab in DevTools
2. Make any request in your app (navigate to a page)
3. Look for requests to `*.supabase.co`
4. Copy the URL (that's your `SUPABASE_URL`)
5. Look at request headers for `apikey` (that's your `SUPABASE_ANON_KEY`)

Then use this simpler version:

```javascript
(async function() {
  const SUPABASE_URL = 'YOUR_URL_HERE'; // e.g., https://xxxxx.supabase.co
  const SUPABASE_KEY = 'YOUR_KEY_HERE'; // Your anon key
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  let totalProcessed = 0;
  let batchNumber = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`📦 Batch ${batchNumber}...`);
    const { data, error } = await supabase.functions.invoke('embed-contacts', {
      body: { mode: 'batch' }
    });
    
    if (error) {
      console.error('❌', error);
      break;
    }
    
    const processed = data.processed || 0;
    hasMore = data.hasMore === true;
    totalProcessed += processed;
    console.log(`✅ ${processed} contacts (${totalProcessed} total)`);
    
    if (hasMore) {
      batchNumber++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`🎉 Done! ${totalProcessed} total.`);
})();
```

## Troubleshooting

**Error: "Unauthorized"**
- Make sure you're logged into your app
- The script uses your current browser session

**Error: "Cannot find module"**
- Make sure you're on a page that has internet access
- The script loads Supabase from a CDN

**Error: "Missing credentials"**
- Use the alternative method above with hardcoded values
- Get values from your `.env` file or Supabase Dashboard

