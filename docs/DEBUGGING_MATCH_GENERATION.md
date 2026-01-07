# Debugging Match Generation Issues

**Last Updated**: 2025-01-31  
**Purpose**: Step-by-step guide to diagnose why matches aren't appearing

---

## 🔍 Quick Diagnosis Checklist

Run through these checks in order:

### ✅ Step 1: Check if Entities Were Extracted

**What to check**: Did the conversation transcript get processed into entities?

**SQL Query**:
```sql
SELECT 
  entity_type,
  value,
  confidence,
  context_snippet
FROM conversation_entities
WHERE conversation_id = 'YOUR_CONVERSATION_ID'  -- Replace with your conversation ID
ORDER BY created_at DESC;
```

**Expected Result**: 
- ✅ Should see entities like `sector: "B2B SaaS"`, `stage: "pre-seed"`, etc.
- ❌ If empty: Entity extraction failed or no entities found in transcript

**Common Issues**:
- No transcript segments (conversation wasn't transcribed)
- Transcript is too short or has no investment-related content
- Entity extraction Edge Function failed (check logs)

---

### ✅ Step 2: Check Your Contacts

**What to check**: Do you have contacts, and do they have theses?

**SQL Query**:
```sql
-- Total contacts
SELECT COUNT(*) as total_contacts
FROM contacts
WHERE owned_by_profile = auth.uid();

-- Contacts with theses (can be AI matched)
SELECT 
  c.name,
  c.company,
  COUNT(t.id) as thesis_count
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
GROUP BY c.id, c.name, c.company
HAVING COUNT(t.id) > 0
ORDER BY c.name;
```

**Expected Result**:
- ✅ Should see contacts with theses (sectors, stages, etc.)
- ❌ If no theses: Only name matching will work

**Common Issues**:
- No contacts in database
- Contacts don't have theses (need to add investment criteria)
- Contacts not marked as `is_investor = true`

---

### ✅ Step 3: Check if Matches Were Generated

**What to check**: Did the matching process create any match suggestions?

**SQL Query**:
```sql
SELECT 
  ms.score,
  ms.reasons,
  ms.justification,
  c.name as contact_name,
  c.company
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'YOUR_CONVERSATION_ID'  -- Replace
ORDER BY ms.score DESC;
```

**Expected Result**:
- ✅ Should see matches with scores (1-3 stars) and reasons
- ❌ If empty: Matching process didn't create any matches

**Common Issues**:
- No entities to match against
- No contacts with matching theses
- GPT returned no matches (check Edge Function logs)

---

### ✅ Step 4: Check Contact Limit (100 Contact Issue)

**What to check**: Is your matching contact in the first 100 contacts?

**SQL Query**:
```sql
-- Shows which contacts are in first 100 (get AI matching)
SELECT 
  ROW_NUMBER() OVER (ORDER BY c.created_at) as processing_order,
  c.name,
  c.company,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) <= 100 
    THEN '✅ Will be AI matched'
    ELSE '❌ Will be skipped (beyond 100 limit)'
  END as status
FROM contacts c
WHERE c.owned_by_profile = auth.uid()
ORDER BY c.created_at
LIMIT 150;
```

**Expected Result**:
- ✅ Your matching contact should be in first 100
- ❌ If beyond 100: Only name matching will work for that contact

**Common Issues**:
- You have >100 contacts
- The contact you expect to match is beyond position 100
- Solution: Add theses to contacts in first 100, or wait for v2 (semantic pre-filtering)

---

### ✅ Step 5: Check Name Matching

**What to check**: Were any contact names mentioned in the conversation?

**SQL Query**:
```sql
-- Check if person_name entities match your contacts
SELECT 
  ce.value as mentioned_name,
  c.name as contact_name,
  CASE 
    WHEN LOWER(c.name) LIKE '%' || LOWER(ce.value) || '%' 
      OR LOWER(ce.value) LIKE '%' || LOWER(c.name) || '%'
    THEN '✅ Potential name match'
    ELSE '❌ No match'
  END as match_status
FROM conversation_entities ce
CROSS JOIN contacts c
WHERE ce.conversation_id = 'YOUR_CONVERSATION_ID'  -- Replace
  AND ce.entity_type = 'person_name'
  AND c.owned_by_profile = auth.uid()
  AND (
    LOWER(c.name) LIKE '%' || LOWER(ce.value) || '%' 
    OR LOWER(ce.value) LIKE '%' || LOWER(c.name) || '%'
  );
```

**Expected Result**:
- ✅ Should see name matches if contacts were mentioned
- ❌ If empty: No contact names were mentioned or extracted

**Common Issues**:
- Names weren't mentioned in conversation
- Name extraction failed (check entity extraction)
- Name spelling doesn't match contact name

---

## 🛠️ Using the Debug Script

I've created a comprehensive debug script: `scripts/debug-matching-issues.sql`

**To use it**:
1. Open Supabase SQL Editor
2. Copy the script
3. Replace `'YOUR_CONVERSATION_ID'` with your actual conversation ID
4. Run each section to diagnose the issue

**The script includes**:
- Entity extraction check
- Contact and thesis verification
- Match generation check
- Contact limit analysis
- Name matching verification
- Comprehensive diagnosis query

---

## 🐛 Common Issues & Solutions

### Issue 1: No Entities Extracted

**Symptoms**: `conversation_entities` table is empty

**Possible Causes**:
1. No transcript segments (conversation wasn't transcribed)
2. Transcript has no investment-related content
3. Entity extraction Edge Function failed

**Solutions**:
- Check `conversation_segments` table for transcript
- Check Edge Function logs in Supabase Dashboard
- Try processing again
- Ensure conversation has investment-related content

---

### Issue 2: No Contacts with Theses

**Symptoms**: Contacts exist but no theses

**Solutions**:
1. Add theses to your contacts:
   ```sql
   INSERT INTO theses (contact_id, sectors, stages, check_sizes, geos)
   VALUES (
     'contact-id-here',
     ARRAY['B2B SaaS', 'Fintech'],
     ARRAY['pre-seed', 'seed'],
     ARRAY['$500K-$2M'],
     ARRAY['San Francisco', 'New York']
   );
   ```

2. Or use the UI: Edit contact → Add thesis

---

### Issue 3: Contact Beyond 100 Limit

**Symptoms**: Contact has thesis but doesn't match

**Solutions**:
1. Check if contact is in first 100 (use SQL query above)
2. If beyond 100, either:
   - Wait for v2 (semantic pre-filtering will fix this)
   - Reorder contacts (not recommended)
   - Add theses to contacts in first 100

---

### Issue 4: GPT Returned No Matches

**Symptoms**: Entities extracted, contacts have theses, but no matches

**Possible Causes**:
1. Theses don't match entities (e.g., entities say "B2B SaaS" but theses say "SaaS")
2. GPT prompt didn't find matches
3. GPT API error

**Solutions**:
- Check Edge Function logs for GPT response
- Verify theses match entity values (case-sensitive matching)
- Check GPT API key is configured
- Try processing again

---

### Issue 5: Name Matching Not Working

**Symptoms**: Contact name mentioned but no 3-star match

**Possible Causes**:
1. Name extraction failed (not extracted as `person_name` entity)
2. Name spelling doesn't match
3. Name matching logic failed

**Solutions**:
- Check if name was extracted as `person_name` entity
- Verify name spelling matches contact name exactly
- Check Edge Function logs for name matching logic

---

## 📊 Edge Function Logs

To check Edge Function logs:

1. Go to Supabase Dashboard
2. Edge Functions → `extract-entities` or `generate-matches`
3. Click "Logs" tab
4. Look for:
   - Errors (red)
   - OpenAI API responses
   - Entity extraction results
   - Match generation results

**Key Log Messages to Look For**:
- `✅ Entities extracted: X`
- `🎯 Generating matches...`
- `Processing X contacts for matching`
- `Name matches found: X`
- `AI matches parsed: X`
- `Total matches: X`

---

## 🧪 Test with Known Good Data

To verify the system works:

1. **Create a test conversation** with transcript
2. **Add a test contact** with thesis:
   - Sector: "B2B SaaS"
   - Stage: "pre-seed"
3. **Process conversation** mentioning:
   - "B2B SaaS startup at pre-seed stage"
4. **Expected**: Contact should match with 2-3 stars

---

## 📝 Next Steps

Once you've identified the issue:

1. **If no entities**: Fix entity extraction
2. **If no theses**: Add theses to contacts
3. **If contact limit**: Wait for v2 or reorder contacts
4. **If GPT issues**: Check logs and improve prompts
5. **If name matching**: Verify name extraction

---

## 🔗 Related Documentation

- **Process Conversation Pipeline**: `docs/PROCESS_CONVERSATION_PIPELINE.md`
- **Current Matching System**: `docs/CURRENT_MATCHING_SYSTEM.md`
- **Test Scripts**: `docs/MATCHING_TEST_SCRIPTS.md`

