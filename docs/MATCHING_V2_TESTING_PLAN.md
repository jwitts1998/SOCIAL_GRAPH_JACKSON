# Matching Engine v2 Testing Plan

**Status**: Pre-Implementation Testing  
**Date**: 2025-01-31

## Overview

Before implementing the full `generate-matches` v2 update, we need to test the changes we've made so far:

1. ✅ Database migration (schema changes)
2. ✅ Polling bug fix (RecordingDrawer.tsx)
3. ✅ New embedding function (embed-conversation-entities)
4. ✅ Schema TypeScript updates

---

## Test Checklist

### 1. Database Migration Testing

**File**: `supabase/migrations/20250201000000_add_matching_v2_fields.sql`

**Steps**:
```bash
# 1. Check current migration status
supabase migration list

# 2. Apply the new migration
supabase db push

# 3. Verify migration was applied
supabase db diff
# Should show "No schema changes detected" if successful
```

**Manual Verification** (in Supabase Dashboard):
- [ ] `match_suggestions` table has new columns:
  - `confidence` (DECIMAL)
  - `semantic_similarity` (DECIMAL)
  - `matching_details` (JSONB)
  - `entity_matches` (JSONB)
  - `contact_field_matches` (JSONB)
- [ ] `conversations` table has `entity_embedding` column (TEXT)
- [ ] `match_history` table exists with correct structure
- [ ] Indexes created on `match_history`:
  - `idx_match_history_match_suggestion_id`
  - `idx_match_history_conversation_id`
  - `idx_match_history_created_at`
- [ ] RLS policies exist for `match_history`:
  - "Users can view their own match history" (SELECT)
  - "Service role can insert match history" (INSERT)

**Expected Result**: Migration applies successfully, all columns/tables created

---

### 2. Polling Bug Fix Testing

**File**: `client/src/components/RecordingDrawer.tsx`

**Test Scenario**: Record a conversation and verify 30-second polling works

**Steps**:
1. Start the dev server: `npm run dev`
2. Navigate to Record page or open RecordingDrawer
3. Start recording a conversation
4. Watch browser console for polling logs

**Expected Console Output** (every 30 seconds):
```
⏰ 30s elapsed, extracting participants...
✅ Participant extraction completed
⏰ 30s elapsed, starting entity extraction and matching...
🔍 Extracting entities...
✅ Entities extracted: X
🎯 Generating matches...
🎉 Found X matches!
✅ Match generation cycle completed
```

**What to Check**:
- [ ] Polling starts immediately when recording begins
- [ ] Logs appear every 30 seconds (not immediately)
- [ ] No errors in console
- [ ] Matches appear in UI (if entities found)
- [ ] Toast notifications appear for high-value matches (3 stars)

**If Polling Doesn't Work**:
- Check browser console for errors
- Verify `conversationId` is set
- Verify `audioState.isRecording` is true
- Verify `audioState.isPaused` is false
- Check that transcript has content

---

### 3. New Embedding Function Testing

**File**: `supabase/functions/embed-conversation-entities/index.ts`

**Step 1: Deploy Function**
```bash
supabase functions deploy embed-conversation-entities
```

**Step 2: Test Function Manually**

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Find `embed-conversation-entities`
3. Click "Invoke" tab
4. Use this test payload:
```json
{
  "conversationId": "<existing-conversation-id-with-entities>"
}
```

**Option B: Using curl (from terminal)**
```bash
# Get your Supabase URL and anon key from .env
curl -X POST \
  'https://<your-project>.supabase.co/functions/v1/embed-conversation-entities' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "conversationId": "<existing-conversation-id-with-entities>"
  }'
```

**Expected Response**:
```json
{
  "embedding": [0.123, -0.456, ...],
  "cached": false,
  "conversationId": "...",
  "entityCount": 5
}
```

**What to Check**:
- [ ] Function deploys successfully
- [ ] Function returns embedding array (1536 dimensions for text-embedding-3-small)
- [ ] Embedding is cached in `conversations.entity_embedding`
- [ ] Second call returns `"cached": true`
- [ ] Function handles missing conversation gracefully
- [ ] Function handles conversation with no entities gracefully

**Error Cases to Test**:
- [ ] Invalid conversationId → Returns 403 Forbidden
- [ ] Conversation with no entities → Returns message, no embedding
- [ ] Missing auth token → Returns 401 Unauthorized
- [ ] Conversation owned by different user → Returns 403 Forbidden

---

### 4. Schema TypeScript Updates Testing

**File**: `shared/schema.ts`

**Steps**:
```bash
# 1. Type check the project
npm run check

# 2. Verify no TypeScript errors related to schema
```

**What to Check**:
- [ ] No TypeScript errors in `shared/schema.ts`
- [ ] New fields are accessible in TypeScript:
  - `matchSuggestions.confidence`
  - `matchSuggestions.semanticSimilarity`
  - `matchSuggestions.matchingDetails`
  - `conversations.entityEmbedding`
  - `matchHistory` table exists

**Manual Verification**:
- [ ] Import and use new fields in a test file
- [ ] Verify types are correct (decimal, jsonb, etc.)

---

## Integration Testing

### Test Full Flow (After All Above Pass)

**Scenario**: Record a conversation and verify matching works

**Steps**:
1. Start recording a conversation
2. Wait for 30-second polling to trigger
3. Verify entities are extracted
4. Verify matches are generated (using current generate-matches)
5. Check that matches are stored in database
6. Verify UI displays matches

**Expected Result**: 
- Polling works every 30 seconds
- Entities extracted successfully
- Matches generated (even if quality is poor, should still work)
- Matches appear in UI

---

## Rollback Plan

If any test fails, we can rollback:

### Rollback Migration
```sql
-- Remove new columns (if migration was applied)
ALTER TABLE match_suggestions 
  DROP COLUMN IF EXISTS confidence,
  DROP COLUMN IF EXISTS semantic_similarity,
  DROP COLUMN IF EXISTS matching_details,
  DROP COLUMN IF EXISTS entity_matches,
  DROP COLUMN IF EXISTS contact_field_matches;

ALTER TABLE conversations
  DROP COLUMN IF EXISTS entity_embedding;

DROP TABLE IF EXISTS match_history;
```

### Rollback Code
- Revert `RecordingDrawer.tsx` changes (git)
- Delete `embed-conversation-entities` function
- Revert `shared/schema.ts` changes

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Proceed with `generate-matches` v2 implementation
2. ✅ Add semantic pre-filtering
3. ✅ Add explainability features
4. ✅ Update UI to show explainability

---

## Test Results Log

**Date**: _______________

**Migration Test**: [ ] Pass [ ] Fail
- Notes: _________________________________

**Polling Test**: [ ] Pass [ ] Fail
- Notes: _________________________________

**Embedding Function Test**: [ ] Pass [ ] Fail
- Notes: _________________________________

**Schema Test**: [ ] Pass [ ] Fail
- Notes: _________________________________

**Integration Test**: [ ] Pass [ ] Fail
- Notes: _________________________________

---

## Questions?

If any test fails, check:
- Supabase Dashboard → Logs for Edge Function errors
- Browser console for frontend errors
- Database connection status
- Environment variables are set correctly

