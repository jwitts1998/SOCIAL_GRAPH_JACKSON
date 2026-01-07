# Debug: Why Isn't Matthew Cook Matching?

**Conversation ID**: `b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4`  
**Issue**: "Matthew Cook" was mentioned in conversation but no match appears

## 🔍 Diagnosis Steps

### Step 1: Check Debug UI

1. Go to the conversation: `/conversation/b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4`
2. Click "Overview" tab
3. Look at the **"DEBUG: Extracted Entities"** section at the top
4. Check if you see:
   - `person_name` type
   - Value: "Matthew Cook" (or "matthew cook", "Matt Cook", etc.)

**If you DON'T see "Matthew Cook" as a `person_name` entity:**
- The entity extraction didn't catch it
- Check what entities WERE extracted
- Maybe it was extracted with a different spelling or as a different type

### Step 2: Check Contact Name

Run this SQL to see exactly how the contact name is stored:

```sql
SELECT 
  id,
  name,
  first_name,
  last_name,
  company
FROM contacts
WHERE owned_by_profile = auth.uid()
  AND (
    LOWER(name) LIKE '%matthew%'
    OR LOWER(name) LIKE '%cook%'
  )
ORDER BY name;
```

**Check**:
- Is the contact name exactly "Matthew Cook"?
- Could it be "Matt Cook", "Matthew, Cook", or "Matthew  Cook" (extra spaces)?
- Does it have `first_name` and `last_name` fields populated?

### Step 3: Check If Match Was Generated

Run this SQL to see if a match was created but maybe not showing in UI:

```sql
SELECT 
  ms.id,
  ms.score,
  ms.reasons,
  ms.status,
  c.name as contact_name
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY ms.created_at DESC;
```

**If matches exist but Matthew Cook isn't there:**
- Name matching logic didn't match
- Check Edge Function logs for name matching details

**If NO matches exist at all:**
- Matching wasn't run, or failed
- Click "Process Conversation" button again

### Step 4: Check Edge Function Logs

1. Go to Supabase Dashboard
2. Edge Functions → `generate-matches`
3. Click "Logs" tab
4. Look for:
   - `Person names mentioned: [...]` - Should include "matthew cook" (lowercase)
   - `Name matches found: X`
   - `Matched contacts: ...`

**If you see the person name in logs but no match:**
- Name matching logic failed
- Contact name doesn't match exactly

**If you DON'T see the person name in logs:**
- Entity wasn't extracted as `person_name`
- Check `extract-entities` logs instead

## 🐛 Common Issues

### Issue 1: Entity Not Extracted as `person_name`

**Symptom**: No `person_name` entity for "Matthew Cook" in debug UI

**Possible Causes**:
- Entity extraction didn't recognize it as a person name
- Extracted as different type (e.g., `persona` instead of `person_name`)
- Name mentioned in a way GPT didn't recognize

**Solution**:
- Check all entities in debug UI
- Look for "Matthew Cook" with a different `entity_type`
- Re-process conversation if needed

### Issue 2: Contact Name Mismatch

**Symptom**: Entity extracted correctly, but no match

**Possible Causes**:
- Contact name is "Matt Cook" but entity is "Matthew Cook"
- Contact name has extra spaces or punctuation
- Contact name is stored differently (first_name/last_name vs name field)

**Solution**:
- Check exact contact name in database
- Update contact name to match, or improve name matching logic

### Issue 3: Match Generation Didn't Run

**Symptom**: No matches in database at all

**Solution**:
- Click "Process Conversation" button
- Check Edge Function logs for errors
- Verify entities exist before running matching

## 🛠️ Quick Fixes

### Fix 1: Re-process Conversation

1. Click "Process Conversation" button
2. Wait for completion
3. Check matches again

### Fix 2: Check Entity Extraction

1. Look at debug UI for extracted entities
2. Verify "Matthew Cook" is there as `person_name`
3. If not, check transcript - was it mentioned clearly?

### Fix 3: Verify Contact Name

1. Run SQL query above to see exact contact name
2. If name is different (e.g., "Matt Cook"), update it to match what was mentioned

## 📊 Full Debug Script

Use `scripts/debug-matthew-cook-match.sql` for comprehensive debugging:

```sql
-- Run the full debug script
-- This checks:
-- 1. If "Matthew Cook" was extracted as person_name
-- 2. If Matthew Cook contact exists
-- 3. If match was generated
-- 4. Name matching simulation
```

## 🎯 Expected Behavior

When "Matthew Cook" is mentioned in a conversation:

1. **Entity Extraction**: Should create `person_name` entity with value "Matthew Cook"
2. **Name Matching**: Should match against contact "Matthew Cook" (or variations)
3. **Match Creation**: Should create 3-star match with reason "Mentioned by name in conversation"
4. **UI Display**: Should appear in "Suggested Intros" tab

If any step fails, use the debug steps above to identify where.

