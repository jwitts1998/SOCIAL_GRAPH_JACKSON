# Quick Test Script Generator

## Step 1: Get Your Contact Data

Run this SQL in Supabase SQL Editor to see your contacts:

```sql
SELECT 
  c.name,
  c.company,
  ARRAY_TO_STRING(t.sectors, ', ') as sectors,
  ARRAY_TO_STRING(t.stages, ', ') as stages,
  ARRAY_TO_STRING(t.check_sizes, ', ') as check_sizes,
  ARRAY_TO_STRING(t.geos, ', ') as geos
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
  AND c.is_investor = true
ORDER BY c.name
LIMIT 10;
```

## Step 2: Create Test Script

Based on your contacts, create a test script like this:

**Template**:
```
"I just talked to a startup founder. They're building a [SECTOR] company at [STAGE] stage. 
They're looking to raise about [CHECK_SIZE]. The company is based in [GEO]. 

I think [CONTACT_NAME] would be a great match for this. They invest in [CONTACT_SECTORS] at 
[CONTACT_STAGES]. We should definitely introduce them."
```

**Example** (if you have a contact "John Smith" who invests in "B2B SaaS" at "pre-seed"):
```
"I just talked to a startup founder. They're building a B2B SaaS company at pre-seed stage. 
They're looking to raise about $1 million. The company is based in San Francisco. 

I think John Smith would be a great match for this. They invest in B2B SaaS at pre-seed. 
We should definitely introduce them."
```

## Step 3: Test

1. Start recording
2. Speak the script
3. Wait 30 seconds
4. Check for matches

---

## Quick Test Scripts (Generic - Use If You Don't Have Contacts Yet)

### Script A: B2B SaaS Pre-Seed
```
"I talked to a B2B SaaS startup at pre-seed stage. They're looking to raise $1M in San Francisco."
```

### Script B: Fintech Seed
```
"I met a fintech company at seed stage. They want to raise $2M and they're based in New York."
```

### Script C: AI Healthcare
```
"I had a call with an AI healthcare startup. They're at seed stage, looking for $1.5M. 
They're building machine learning tools for hospitals."
```

---

## What to Check After 30 Seconds

1. **Console Logs**:
   - `⏰ 30s elapsed, starting entity extraction and matching...`
   - `🔍 Extracting entities...`
   - `✅ Entities extracted: X`
   - `🎯 Generating matches...`
   - `🎉 Found X matches!`

2. **UI**:
   - Matches appear in "Suggested Intros" tab
   - Match scores (1-3 stars) are shown
   - Match reasons are displayed

3. **Database** (optional):
   ```sql
   -- Check entities
   SELECT * FROM conversation_entities 
   WHERE conversation_id = 'your-conversation-id'
   ORDER BY created_at DESC;
   
   -- Check matches
   SELECT * FROM match_suggestions 
   WHERE conversation_id = 'your-conversation-id'
   ORDER BY score DESC;
   ```

