# Conversation Summary Feature - Setup Guide

## ✅ What's Been Created

A new conversation summary feature has been added that uses OpenAI to generate summaries of transcribed conversations. This serves as a validation feature to verify OpenAI connectivity is working.

### Files Created/Modified:

1. **Database Migration**: `supabase/migrations/20250131000000_add_conversation_summary.sql`
   - Adds `summary` TEXT field to `conversations` table

2. **Schema Update**: `shared/schema.ts`
   - Added `summary` field to conversations table definition

3. **Edge Function**: `supabase/functions/generate-summary/index.ts`
   - Calls OpenAI GPT-3.5-turbo to generate conversation summaries
   - Saves summary back to the conversations table

4. **Frontend Integration**:
   - `client/src/lib/edgeFunctions.ts` - Added `generateSummary()` function
   - `client/src/pages/ConversationDetail.tsx` - Added summary display and generation button
   - `client/src/lib/supabaseHelpers.ts` - Updated to handle summary field

## 🚀 Deployment Steps

### Step 1: Run Database Migration

Apply the migration to add the summary field to your database:

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20250131000000_add_conversation_summary.sql`
3. Paste and click "Run"

**Option B: Via Supabase CLI**
```bash
supabase db push
```

### Step 2: Deploy Edge Function

Deploy the new `generate-summary` Edge Function:

```bash
supabase functions deploy generate-summary
```

Or if using Supabase CLI:
```bash
cd /Users/jacksonwittenberg/dev/projects/Social_Graph_Jackson
supabase link --project-ref mtelyxosqqaeadrrrtgk  # if not already linked
supabase functions deploy generate-summary
```

### Step 3: Verify Secrets

Make sure these secrets are set in Supabase Dashboard → Edge Functions → Secrets:
- ✅ `OPENAI_API_KEY` (should already be set)
- ✅ `SUPABASE_URL` (should already be set)
- ✅ `SUPABASE_ANON_KEY` (should already be set)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (should already be set)

### Step 4: Test the Feature

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your app**: http://localhost:5001

3. **Go to a conversation** that has been transcribed

4. **Go to the "Overview" tab**

5. **Click "Generate Summary"** button in the Summary section

6. **Watch the console** for:
   - `📝 Generating conversation summary...`
   - `✅ Summary generated:`

7. **Check Supabase Dashboard → Edge Functions → Logs** for `generate-summary` function execution

8. **Verify the summary appears** in the Summary section

## 🧪 Validation

This feature validates:
- ✅ OpenAI API connectivity
- ✅ Edge Function deployment and execution
- ✅ Database write operations
- ✅ Frontend-backend integration

## 📝 How It Works

1. User clicks "Generate Summary" button
2. Frontend calls `generateSummary()` function
3. Function invokes `generate-summary` Edge Function
4. Edge Function:
   - Validates user authentication
   - Verifies conversation ownership
   - Reads conversation segments from database
   - Calls OpenAI GPT-3.5-turbo API to generate summary
   - Saves summary to conversations table
   - Returns summary to frontend
5. Frontend refreshes conversation data to display summary

## 🎯 Expected Behavior

- Summary appears in a card at the top of the Overview tab
- Summary is a concise, well-structured overview of the conversation
- Button shows loading state while generating
- Success/error toasts appear
- Summary persists after page refresh

## 🔍 Troubleshooting

### "OPENAI_API_KEY not configured"
- Check Supabase Dashboard → Edge Functions → Secrets
- Verify `OPENAI_API_KEY` is set

### "No conversation segments found"
- Make sure the conversation has been transcribed
- Check that `conversation_segments` table has data for this conversation

### "Forbidden: You do not own this conversation"
- This should not happen if you're logged in correctly
- Check authentication is working

### Summary not appearing after generation
- Check browser console for errors
- Verify Edge Function logs in Supabase Dashboard
- Check that database migration was applied
- Refresh the page to reload conversation data

## 💰 Cost Estimate

- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average summary generation: ~$0.01-0.02 per conversation (depending on length)

