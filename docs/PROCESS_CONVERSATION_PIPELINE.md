# Process Conversation Pipeline

**Last Updated**: 2025-01-31  
**Purpose**: Document what happens when you click "Process Conversation" button

## ✅ Yes, the System Works!

The "Process Conversation" button **does work** and runs a complete pipeline to generate matches.

---

## 🔄 Pipeline Overview

When you click **"Process Conversation"** in `ConversationDetail.tsx`, it runs:

### Step 1: Extract Entities
**Function**: `extractEntities(conversationId)`  
**Edge Function**: `supabase/functions/extract-entities/index.ts`

**What it does**:
1. Reads conversation transcript segments from `conversation_segments` table
2. Limits to last 30 segments (about 2-3 minutes) to avoid timeout
3. Sends transcript to OpenAI GPT-3.5-turbo with extraction prompt
4. Extracts investment entities:
   - `sector` (e.g., "B2B SaaS", "Fintech")
   - `stage` (e.g., "pre-seed", "seed", "Series A")
   - `check_size` (e.g., "$1M", "$500K-$2M")
   - `geo` (e.g., "San Francisco", "New York")
   - `persona` (e.g., "GP", "angel", "family office")
   - `intent` (e.g., "looking for investors")
   - `person_name` (e.g., "John Smith", "Arjun Metre")
5. Stores entities in `conversation_entities` table

**Output**: Array of entities with `entity_type`, `value`, `confidence`, `context_snippet`

---

### Step 2: Generate Matches
**Function**: `generateMatches(conversationId)`  
**Edge Function**: `supabase/functions/generate-matches/index.ts`

**What it does**:

#### 2a. Read Data
- Reads all entities from `conversation_entities` for this conversation
- Reads all contacts with their theses from `contacts` and `theses` tables
- Filters contacts to only those owned by the user

#### 2b. Name Matching (Direct Matches)
- Separates `person_name` entities from other entities
- Matches mentioned names against contact names (fuzzy matching)
- **Name matches = 3 stars automatically**
- Example: If conversation mentions "Arjun Metre", and you have a contact "Arjun Metre", it gets 3 stars

#### 2c. AI-Based Matching (Thesis Matching)
- If there are non-name entities (sector, stage, etc.):
  - Limits contacts to **first 100** (to avoid timeout/payload size)
  - Sends to OpenAI GPT-3.5-turbo with:
    - Entity summary (grouped by type)
    - Contact list with their theses
  - GPT scores each contact (1-3 stars) based on thesis match
  - Returns matches with:
    - `score`: 1-3 stars
    - `reasons`: Array of what matched (e.g., `["stage: pre-seed", "sector: B2B SaaS"]`)
    - `justification`: Brief explanation

#### 2d. Merge Results
- Combines name matches (3 stars) + AI matches (1-3 stars)
- Removes duplicates (name matches take priority)

#### 2e. Store Matches
- Inserts all matches into `match_suggestions` table with:
  - `conversation_id`
  - `contact_id`
  - `score` (1-3)
  - `reasons` (JSON array)
  - `justification` (text)
  - `status` (default: 'pending')

**Output**: Array of matches with contact info, scores, and reasons

---

## 📊 Current Limitations

### 1. 100 Contact Limit
**Location**: `supabase/functions/generate-matches/index.ts:140`
```typescript
const limitedContacts = contacts.slice(0, 100);
```

**Why**: To avoid OpenAI API timeout and payload size limits

**Impact**: If you have >100 contacts, only the first 100 are considered for AI matching

**Note**: Name matching works for ALL contacts (not limited to 100)

---

### 2. No Semantic Pre-filtering
**Current**: All contacts sent to GPT (up to 100)

**Future (v2)**: Will use embeddings to pre-filter contacts before sending to GPT

---

### 3. No Explainability Details
**Current**: Basic `reasons` array and `justification` text

**Future (v2)**: Will add:
- `confidence` score (0.0-1.0)
- `semantic_similarity` score
- `matching_details` (JSON with detailed breakdown)
- `entity_matches` (which entities matched)
- `contact_field_matches` (which contact fields matched)

---

## 🧪 How to Test

### Test 1: Name Matching
1. Go to a conversation with transcript
2. Click "Process Conversation"
3. Check console for logs:
   - `🔍 Extracting entities from conversation...`
   - `✅ Entities extracted: X`
   - `🎯 Generating matches...`
   - `✅ Match generation response: X matches`
4. Check "Suggested Intros" tab for matches
5. **Expected**: If you mentioned a contact name, they should appear with 3 stars

### Test 2: Thesis Matching
1. Ensure you have contacts with theses (sectors, stages, etc.)
2. Process a conversation that mentions:
   - Sectors (e.g., "B2B SaaS", "Fintech")
   - Stages (e.g., "pre-seed", "seed")
   - Check sizes (e.g., "$1M")
3. **Expected**: Contacts with matching theses should appear with 1-3 stars

### Test 3: No Matches
1. Process a conversation with no investment-related content
2. **Expected**: No matches (or only very weak 1-star matches)

---

## 🔍 Debugging

### Check Entities Were Extracted
```sql
SELECT * FROM conversation_entities 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at DESC;
```

### Check Matches Were Generated
```sql
SELECT 
  ms.*,
  c.name as contact_name,
  c.company
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'your-conversation-id'
ORDER BY ms.score DESC, ms.created_at DESC;
```

### Check Edge Function Logs
1. Go to Supabase Dashboard
2. Edge Functions → `extract-entities` or `generate-matches`
3. View logs for errors or detailed output

---

## 📝 Code Locations

### Frontend
- **Button**: `client/src/pages/ConversationDetail.tsx:290-307`
- **Handler**: `client/src/pages/ConversationDetail.tsx:141-180`
- **Edge Function Wrappers**: `client/src/lib/edgeFunctions.ts:47-71`

### Backend (Edge Functions)
- **Extract Entities**: `supabase/functions/extract-entities/index.ts`
- **Generate Matches**: `supabase/functions/generate-matches/index.ts`

---

## 🎯 What to Check If No Matches Appear

1. **Entities extracted?**
   - Check `conversation_entities` table
   - If empty, entity extraction failed or no entities found

2. **Contacts have theses?**
   - Check `theses` table for your contacts
   - If no theses, only name matching will work

3. **Contact limit?**
   - If you have >100 contacts, check if the matching contact is in first 100
   - Name matching bypasses this limit

4. **GPT response?**
   - Check Edge Function logs for OpenAI errors
   - Check if GPT returned valid JSON

5. **Match insertion?**
   - Check `match_suggestions` table
   - Check for database errors in Edge Function logs

---

## 🚀 Next Steps for v2

1. **Remove 100 contact limit** (use semantic pre-filtering)
2. **Add explainability** (confidence scores, detailed matching)
3. **Store match history** (timeline view of match generations)
4. **Improve GPT prompts** (better scoring, more detailed reasons)

---

## 📚 Related Documentation

- **Current Matching System**: `docs/CURRENT_MATCHING_SYSTEM.md`
- **Matching Engine v2 Design**: `docs/MATCHING_ENGINE_V2_DESIGN.md`
- **Test Scripts**: `docs/MATCHING_TEST_SCRIPTS.md`
- **Personalized Test Scripts**: `docs/PERSONALIZED_TEST_SCRIPTS.md`

