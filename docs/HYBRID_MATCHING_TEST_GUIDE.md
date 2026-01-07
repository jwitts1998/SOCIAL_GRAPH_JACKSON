# Hybrid Matching Test Guide

**Last Updated**: 2025-01-31  
**Purpose**: Step-by-step guide to test the new hybrid matching implementation

---

## Pre-Deployment Checklist

Before testing, verify:

1. **Edge Function Deployed**: `supabase functions deploy generate-matches`
2. **Migration Applied**: `semantic_similarity` field exists in `match_suggestions` table
3. **Embeddings Generated**: Contacts have `bio_embedding` or `thesis_embedding`
4. **Conversation Has Entities**: Test conversation has extracted entities

---

## Quick Test

### Step 1: Choose a Test Conversation

Use an existing conversation with:
- Extracted entities (check debug UI)
- At least 5-10 contacts in your database
- Some contacts with embeddings

**Recommended**: Use conversation `b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4` (you mentioned Matthew Cook)

### Step 2: Verify Prerequisites

Run in Supabase SQL Editor:

```sql
-- Check entities
SELECT COUNT(*) as entity_count 
FROM conversation_entities 
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- Check embedding (may be null, that's OK - will be generated)
SELECT entity_embedding IS NOT NULL as has_embedding 
FROM conversations 
WHERE id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- Check contacts with embeddings
SELECT COUNT(*) as contacts_with_embeddings 
FROM contacts 
WHERE owned_by_profile = auth.uid() 
  AND (bio_embedding IS NOT NULL OR thesis_embedding IS NOT NULL);
```

**Expected**:
- ✅ Entity count > 0
- ✅ Has embedding (or will be generated)
- ✅ At least some contacts have embeddings

### Step 3: Process Conversation

1. Go to: `/conversation/b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4`
2. Click: **"Process Conversation"** button
3. Wait: 5-10 seconds for processing

### Step 4: Check Edge Function Logs

Go to Supabase Dashboard → Edge Functions → `generate-matches` → Logs

**Look for these log messages**:

```
✅ Using cached conversation embedding
OR
📝 No cached embedding found, generating...
✅ Generated conversation embedding
```

```
🔍 Starting semantic pre-filtering with embeddings...
📊 Calculated similarity for X contacts with embeddings
📈 Top 5 similarities: Contact A: 0.856, Contact B: 0.823, ...
✅ Pre-filtered to X contacts (Y with embeddings, Z without)
```

```
🎯 Processing X pre-filtered contacts for GPT scoring
```

**Expected**:
- ✅ Embedding retrieved or generated
- ✅ Similarity calculated for contacts with embeddings
- ✅ Pre-filtered to ~50 contacts (or less if you have fewer)
- ✅ Only pre-filtered contacts sent to GPT

### Step 5: Verify Matches

Run in Supabase SQL Editor:

```sql
SELECT 
  ms.score,
  ms.semantic_similarity,
  ms.reasons,
  c.name as contact_name,
  c.company
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY ms.score DESC, ms.semantic_similarity DESC NULLS LAST;
```

**Expected**:
- ✅ Matches have `semantic_similarity` scores (0.0-1.0) or NULL
- ✅ Top matches have high similarity (>0.7) if they have embeddings
- ✅ Name matches (Matthew Cook) should appear with 3 stars
- ✅ Matches are ranked by score + similarity

### Step 6: Check Debug UI

1. Go to conversation → Overview tab
2. Check **"DEBUG: Extracted Entities"** section
3. Verify entities were extracted correctly

---

## Detailed Test Scenarios

### Scenario 1: Conversation with Cached Embedding

**Setup**: Conversation already has `entity_embedding`

**Expected**:
- ✅ Log: "✅ Using cached conversation embedding"
- ✅ Fast processing (no embedding generation)
- ✅ Pre-filtering works correctly

### Scenario 2: Conversation Without Embedding

**Setup**: Conversation has entities but no `entity_embedding`

**Expected**:
- ✅ Log: "📝 No cached embedding found, generating..."
- ✅ Log: "✅ Generated conversation embedding"
- ✅ Embedding cached in database
- ✅ Pre-filtering works correctly

### Scenario 3: Contacts Without Embeddings

**Setup**: Some contacts have embeddings, some don't

**Expected**:
- ✅ Contacts with embeddings: Pre-filtered by similarity
- ✅ Contacts without embeddings: Included in GPT scoring (up to 50)
- ✅ Both types of contacts can match

### Scenario 4: No Embeddings Available

**Setup**: No conversation embedding, no contact embeddings

**Expected**:
- ✅ Log: "⚠️ No conversation embedding available, skipping pre-filtering"
- ✅ Falls back to original GPT-only matching
- ✅ Still works (backward compatible)
- ✅ All contacts sent to GPT (up to reasonable limit)

### Scenario 5: Large Contact List (100+ contacts)

**Setup**: 200+ contacts, all with embeddings

**Expected**:
- ✅ Pre-filtering selects top 50 by similarity
- ✅ Only 50 contacts sent to GPT
- ✅ Fast processing (<5 seconds)
- ✅ Cost reduction (~50% vs sending 100)

---

## Success Criteria

### ✅ Core Functionality

- [ ] Embedding retrieved or generated successfully
- [ ] Similarity calculated for contacts with embeddings
- [ ] Top 50 contacts selected by similarity
- [ ] Only pre-filtered contacts sent to GPT
- [ ] Matches created with `semantic_similarity` field
- [ ] Scores combined correctly (70% GPT + 30% embedding)

### ✅ Performance

- [ ] Pre-filtering completes in <2 seconds
- [ ] Total matching time <10 seconds
- [ ] No timeout errors
- [ ] Handles 100+ contacts efficiently

### ✅ Quality

- [ ] Top matches have high similarity scores (>0.7)
- [ ] Name matches still work (Matthew Cook = 3 stars)
- [ ] Match quality is good (relevant contacts matched)
- [ ] Explainability improved (can see similarity scores)

### ✅ Cost

- [ ] GPT token usage reduced (~50% fewer contacts)
- [ ] Cost per conversation reduced
- [ ] Embedding generation is cached (not regenerated)

---

## Troubleshooting

### Issue: "No cached embedding found" but embedding generation fails

**Check**:
1. Is `embed-conversation-entities` function deployed?
2. Are there entities in `conversation_entities` table?
3. Check Edge Function logs for errors

**Solution**: Function should fall back to GPT-only matching gracefully

### Issue: No similarity scores in matches

**Check**:
1. Do contacts have `bio_embedding` or `thesis_embedding`?
2. Does conversation have `entity_embedding`?
3. Check Edge Function logs for pre-filtering step

**Solution**: Generate embeddings for contacts using `embed-contacts` function

### Issue: Still seeing 100 contacts sent to GPT

**Check**:
1. Is the new code deployed?
2. Check logs for "Pre-filtered to X contacts"
3. Verify `preFilteredContacts` is being used

**Solution**: Redeploy function, clear cache if needed

### Issue: Matches seem wrong or missing

**Check**:
1. Are entities extracted correctly? (check debug UI)
2. Do contacts have theses that match entities?
3. Check similarity scores - are they reasonable?

**Solution**: Verify entities and contact theses are correct

---

## Performance Benchmarks

### Expected Performance

| Contact Count | Pre-filtering Time | GPT Scoring Time | Total Time |
|---------------|-------------------|------------------|------------|
| 50 contacts   | <0.5s            | 2-5s            | 3-6s       |
| 100 contacts  | <1s              | 3-6s            | 4-7s       |
| 500 contacts  | <2s              | 3-6s            | 5-8s       |
| 1000 contacts | <3s              | 3-6s            | 6-9s       |

### Expected Cost Reduction

| Before (100 contacts) | After (50 contacts) | Savings |
|----------------------|---------------------|---------|
| ~50K tokens          | ~25K tokens         | ~50%    |
| ~$0.075/conversation | ~$0.0375/conversation | ~50% |

---

## Next Steps After Testing

1. **If tests pass**: 
   - Mark tasks as complete
   - Move to nickname matching (Task F2_T7)
   - Add more logging (Task F2_T9)

2. **If issues found**:
   - Check Edge Function logs
   - Verify embeddings exist
   - Test with simpler scenario
   - Review code for bugs

3. **Performance tuning**:
   - Adjust pre-filtering threshold (currently top 50)
   - Tune score combination weights (currently 70/30)
   - Optimize similarity calculation if needed

---

## Test Script

Use the automated test script:

```bash
./scripts/test-hybrid-matching.sh <conversation-id>
```

Or run manually following the steps above.

