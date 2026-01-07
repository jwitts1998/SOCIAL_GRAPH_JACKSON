# Matching Engine v2 Design

**Status**: Design Phase  
**Last Updated**: 2025-01-31  
**Goal**: Improve current OpenAI-based matching system with explainability, better quality, and bug fixes

---

## Executive Summary

Matching Engine v2 will enhance the current OpenAI-based system by:
1. **Fixing the polling bug** that prevents 30-second matching
2. **Adding explainability** - detailed insights into why matches are made
3. **Removing contact limit** - process all contacts, not just 100
4. **Improving match quality** - better GPT prompts and semantic pre-filtering
5. **Adding new features** - confidence scores, match history, detailed explanations

**Key Decision**: Use existing contact embeddings (`bio_embedding`, `thesis_embedding`) to pre-filter contacts before sending to GPT, reducing costs and improving quality.

---

## Current System Issues

### 1. Polling Bug
**Problem**: 30-second polling not working in `RecordingDrawer.tsx`
- Interval runs every 5s but checks for 30s elapsed
- Errors are silently caught
- May not execute if transcript is empty
- Refs may not be properly initialized

**Fix**: Debug and fix polling logic, add better error handling and logging

### 2. No Explainability
**Problem**: No insight into matching logic
- Only see final score (1-3 stars) and reasons array
- Can't see which entities matched which contact fields
- Can't see GPT's reasoning process
- Can't troubleshoot why matches are poor

**Fix**: Add detailed matching metadata and explanations

### 3. Contact Limit
**Problem**: Limited to 100 contacts per request
- Users with >100 contacts miss potential matches
- Arbitrary limit causes incomplete results

**Fix**: Remove limit, use semantic pre-filtering to reduce GPT input size

### 4. Poor Match Quality
**Problem**: Not seeing good matches
- GPT prompt may not be optimal
- No semantic understanding of contact profiles
- No way to tune matching criteria

**Fix**: Improve prompts, add semantic pre-filtering, add explainability for tuning

---

## Embeddings Strategy Explained

### What Are Embeddings?

Embeddings are numerical representations of text that capture semantic meaning. Similar texts have similar embeddings (close in vector space).

**Example**:
- "B2B SaaS startup" and "enterprise software company" → similar embeddings
- "pre-seed" and "seed stage" → similar embeddings
- "SF Bay Area" and "San Francisco" → similar embeddings

### Current Embeddings Infrastructure

You already have:
- `embed-contacts` function that generates embeddings
- `bio_embedding` and `thesis_embedding` stored in `contacts` table
- Uses `text-embedding-3-small` model (1536 dimensions)

### How to Use Embeddings for Matching

**Option 1: Semantic Pre-Filtering (Recommended)**
1. Generate embedding for conversation entities (combine all entity values)
2. Compare against all contact embeddings (cosine similarity)
3. Pre-filter to top 50-100 most similar contacts
4. Send only those to GPT for final scoring
5. **Benefit**: Reduces GPT costs, improves quality (only relevant contacts)

**Option 2: Embedding-Only Matching**
1. Use embeddings to find similar contacts
2. Skip GPT entirely
3. **Benefit**: Very fast, low cost
4. **Drawback**: Less nuanced than GPT, harder to explain

**Option 3: Hybrid (Best of Both)**
1. Use embeddings for pre-filtering (top 100)
2. Use GPT for final scoring and explanation
3. **Benefit**: Fast, cost-effective, high quality, explainable

### Recommendation: Option 3 (Hybrid)

**Why**:
- Leverages existing embeddings infrastructure
- Reduces GPT costs (only evaluate relevant contacts)
- Improves match quality (semantic understanding)
- Keeps GPT for explainability
- Stays within Supabase Edge Functions

**Implementation**:
1. Create `embed-conversation-entities` function (generate embedding for entity summary)
2. Update `generate-matches` to:
   - Generate/retrieve conversation embedding
   - Compare against all contact embeddings (cosine similarity)
   - Pre-filter to top 100 most similar
   - Send to GPT for final scoring with detailed explanations

---

## v2 Architecture

### Data Flow

```
1. Recording → Transcript segments (real-time)
   ↓
2. Every 30s (polling - FIXED):
   a. Extract entities → conversation_entities
   b. Generate conversation embedding (if not cached)
   c. Compare against all contact embeddings
   d. Pre-filter to top 100 most similar contacts
   e. Send to GPT with detailed prompt for scoring + explanation
   f. Store matches with full explainability metadata
   ↓
3. UI updates via Supabase Realtime
```

### New Database Schema

**Add to `match_suggestions` table**:
```sql
ALTER TABLE match_suggestions ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);
ALTER TABLE match_suggestions ADD COLUMN IF NOT EXISTS semantic_similarity DECIMAL(5,4);
ALTER TABLE match_suggestions ADD COLUMN IF NOT EXISTS matching_details JSONB;
ALTER TABLE match_suggestions ADD COLUMN IF NOT EXISTS entity_matches JSONB;
ALTER TABLE match_suggestions ADD COLUMN IF NOT EXISTS contact_field_matches JSONB;
```

**New `matching_details` JSONB structure**:
```typescript
{
  // GPT's detailed reasoning
  reasoning: string;
  
  // Which entities matched which contact fields
  entityMatches: {
    sector: { matched: boolean, conversationValue: string, contactValue: string[] },
    stage: { matched: boolean, conversationValue: string, contactValue: string[] },
    geo: { matched: boolean, conversationValue: string, contactValue: string[] },
    checkSize: { matched: boolean, conversationValue: string, contactValue: string[] },
    persona: { matched: boolean, conversationValue: string, contactValue: string[] }
  },
  
  // Semantic similarity scores
  semanticScores: {
    bioSimilarity: number,      // 0-1
    thesisSimilarity: number,   // 0-1
    overallSimilarity: number   // 0-1
  },
  
  // Match strength breakdown
  scoreBreakdown: {
    entityMatches: number,      // 0-1 (rule-based)
    semanticSimilarity: number,  // 0-1
    relationshipBoost: number,  // 0-1 (if relationship data exists)
    finalScore: number          // 0-1 (before mapping to 1-3 stars)
  },
  
  // GPT model info
  model: string,
  promptVersion: string,
  timestamp: string
}
```

**New `match_history` table** (for tracking match evolution):
```sql
CREATE TABLE match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_suggestion_id UUID REFERENCES match_suggestions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  confidence DECIMAL(3,2),
  semantic_similarity DECIMAL(5,4),
  matching_details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Implementation Plan

### Phase 1: Fix Polling Bug

**File**: `client/src/components/RecordingDrawer.tsx`

**Changes**:
1. Fix ref initialization (initialize to current time, not 0)
2. Add better error handling and logging
3. Add debug logs to track polling execution
4. Ensure transcript check doesn't block execution unnecessarily

**Code**:
```typescript
// Initialize refs to current time (not 0)
const lastExtractTimeRef = useRef<number>(Date.now());
const lastMatchTimeRef = useRef<number>(Date.now());

// In polling interval:
if (now - lastMatchTimeRef.current >= 30000) {
  console.log('⏰ 30s elapsed, triggering match generation...');
  try {
    // ... existing code ...
  } catch (error) {
    console.error('❌ Match generation error:', error);
    toast({
      title: "Match generation failed",
      description: error.message,
      variant: "destructive",
    });
  }
}
```

### Phase 2: Add Conversation Embedding Function

**New File**: `supabase/functions/embed-conversation-entities/index.ts`

**Purpose**: Generate embedding for conversation entity summary

**Input**: `{ conversationId: string }`

**Process**:
1. Fetch all entities for conversation
2. Combine entity values into text: `"B2B SaaS pre-seed $1M SF Bay Area GP actively investing"`
3. Generate embedding using `text-embedding-3-small`
4. Cache in `conversation_entities` table or separate cache table

**Output**: `{ embedding: number[], cached: boolean }`

### Phase 3: Update generate-matches Function

**File**: `supabase/functions/generate-matches/index.ts`

**Major Changes**:

1. **Remove 100 contact limit**
2. **Add semantic pre-filtering**:
   - Generate/retrieve conversation embedding
   - Compare against all contact embeddings
   - Pre-filter to top 100 most similar
3. **Enhanced GPT prompt** for explainability:
   - Request detailed reasoning
   - Request entity-to-field matching breakdown
   - Request confidence scores
4. **Store detailed metadata** in `matching_details` JSONB
5. **Add confidence and semantic_similarity** fields

**New GPT Prompt Structure**:
```typescript
{
  role: 'system',
  content: `You are a relationship matching engine for VCs and investors.
  
  Your task: Score each contact based on how well their thesis matches the conversation entities.
  
  IMPORTANT: Provide detailed explanations for your scoring decisions.
  
  For each contact, return:
  - score: 1-3 (1=weak, 2=medium, 3=strong)
  - confidence: 0.0-1.0 (how confident you are in this match)
  - reasoning: Detailed explanation of why this is a match
  - entityMatches: Breakdown of which entities matched which contact fields
  - scoreBreakdown: Numerical breakdown of scoring components
  
  Scoring guidelines:
  - 3 stars: Strong match (3+ overlapping criteria OR perfect fit for key criteria)
  - 2 stars: Medium match (2 overlapping criteria OR good fit on important criteria)
  - 1 star: Weak match (1 overlapping criterion OR relevant but not perfect fit)
  
  Match on ANY of these:
  - Investment stage (pre-seed, seed, Series A, etc.)
  - Sector/vertical (B2B SaaS, fintech, healthcare, AI, etc.)
  - Check size ($1M, $5M, etc.)
  - Geography (SF Bay Area, NYC, remote, etc.)
  - Persona type (GP, angel, family office, etc.)
  
  Return JSON array with detailed matching information.`
}
```

**Response Format**:
```typescript
[
  {
    contact_id: string,
    score: 1-3,
    confidence: 0.0-1.0,
    reasoning: string,
    entityMatches: {
      sector: { matched: boolean, conversationValue: string, contactValue: string[] },
      stage: { matched: boolean, conversationValue: string, contactValue: string[] },
      // ... etc
    },
    scoreBreakdown: {
      entityMatches: number,
      semanticSimilarity: number,
      relationshipBoost: number,
      finalScore: number
    },
    reasons: string[],
    justification: string
  }
]
```

### Phase 4: Add Match History Tracking

**Purpose**: Track how matches evolve over time during a conversation

**Implementation**:
- After each match generation, insert into `match_history` table
- Link to `match_suggestions` via foreign key
- Allow UI to show match evolution timeline

### Phase 5: Update UI for Explainability

**Files**: 
- `client/src/components/SuggestionCard.tsx`
- `client/src/pages/ConversationDetail.tsx`

**New Features**:
1. **Expandable match details** - Show/hide matching breakdown
2. **Entity match visualization** - Show which entities matched which fields
3. **Confidence indicator** - Visual confidence score
4. **Semantic similarity display** - Show embedding similarity scores
5. **Match history timeline** - Show how match score changed over time

---

## Detailed Matching Algorithm

### Step 1: Entity Extraction (Existing)
- Extract entities from transcript
- Store in `conversation_entities` table

### Step 2: Generate Conversation Embedding
- Combine all entity values into text
- Generate embedding using `text-embedding-3-small`
- Cache for reuse

### Step 3: Semantic Pre-Filtering
```typescript
// For each contact with embeddings:
const bioSimilarity = cosineSimilarity(conversationEmbedding, contact.bio_embedding);
const thesisSimilarity = cosineSimilarity(conversationEmbedding, contact.thesis_embedding);
const overallSimilarity = (bioSimilarity * 0.4) + (thesisSimilarity * 0.6);

// Sort by overallSimilarity, take top 100
const topContacts = contacts
  .filter(c => c.bio_embedding || c.thesis_embedding)
  .sort((a, b) => b.overallSimilarity - a.overallSimilarity)
  .slice(0, 100);
```

### Step 4: GPT Scoring with Explainability
- Send pre-filtered contacts to GPT
- Request detailed explanations
- Get confidence scores and breakdowns

### Step 5: Store Results
- Insert matches with full metadata
- Store in `match_suggestions` table
- Optionally insert into `match_history` for tracking

---

## Scoring Formula (Enhanced)

```
final_score = (
  entity_match_score * 0.4 +      // Rule-based entity matching
  semantic_similarity * 0.4 +     // Embedding similarity
  relationship_boost * 0.2         // Existing relationship strength
) * quality_multiplier

where:
- entity_match_score: 0-1 (based on entity-to-field matches)
- semantic_similarity: 0-1 (from embedding comparison)
- relationship_boost: 0-1 (from relationship_scores table, if exists)
- quality_multiplier: 0.8-1.2 (based on GPT confidence)

Map to stars:
- final_score >= 0.75 → 3 stars
- final_score >= 0.50 → 2 stars
- final_score >= 0.25 → 1 star
```

---

## Explainability Features

### 1. Entity Match Breakdown
Show which conversation entities matched which contact fields:
- "sector: B2B SaaS" matched contact's thesis sectors: ["B2B SaaS", "Enterprise Software"]
- "stage: pre-seed" matched contact's thesis stages: ["pre-seed", "seed"]

### 2. Semantic Similarity Scores
Show embedding-based similarity:
- Bio similarity: 0.85 (high)
- Thesis similarity: 0.72 (medium)
- Overall similarity: 0.78

### 3. Score Breakdown
Show numerical components:
- Entity matches: 0.6
- Semantic similarity: 0.78
- Relationship boost: 0.3
- Final score: 0.65 → 2 stars

### 4. GPT Reasoning
Show GPT's explanation:
- "This contact is a strong match because they invest in B2B SaaS at pre-seed stage, which matches the conversation's focus. Their thesis emphasizes AI/ML, which aligns with the tech stack mentioned."

### 5. Match History
Show how match evolved:
- 0:00 - No match (no entities yet)
- 0:30 - 1 star (weak match, only sector)
- 1:00 - 2 stars (medium match, sector + stage)
- 1:30 - 3 stars (strong match, sector + stage + geo)

---

## Performance Considerations

### Caching Strategy
1. **Conversation embeddings**: Cache in database, regenerate only if entities change
2. **Contact embeddings**: Already cached in `contacts` table
3. **Match results**: Cache for 5 minutes (conversation doesn't change much in short time)

### Batch Processing
- Process contacts in batches of 50 for embedding comparison
- Use Promise.all for parallel processing where possible

### Timeout Handling
- Increase timeout to 60s (Edge Function limit)
- Add progress logging for long operations
- Graceful degradation if GPT times out (return partial results)

---

## Testing Plan

### Unit Tests
1. Test semantic similarity calculation
2. Test pre-filtering logic
3. Test GPT prompt parsing
4. Test metadata storage

### Integration Tests
1. Test full matching flow (entities → embedding → pre-filter → GPT → storage)
2. Test with 0, 50, 100, 500 contacts
3. Test error handling (GPT timeout, missing embeddings, etc.)

### Manual Testing
1. Record test conversation
2. Verify 30s polling works
3. Verify matches appear with explainability
4. Verify match quality is improved
5. Verify all contacts are considered (not just 100)

---

## Migration Plan

### Step 1: Add New Columns (Non-Breaking)
```sql
ALTER TABLE match_suggestions 
  ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS semantic_similarity DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS matching_details JSONB,
  ADD COLUMN IF NOT EXISTS entity_matches JSONB,
  ADD COLUMN IF NOT EXISTS contact_field_matches JSONB;
```

### Step 2: Deploy New Functions
- Deploy `embed-conversation-entities`
- Deploy updated `generate-matches`

### Step 3: Backfill Embeddings (Optional)
- Run batch job to generate embeddings for conversations without them
- Use existing `embed-contacts` batch mode as template

### Step 4: Update Frontend
- Update UI to show explainability features
- Add match history visualization

### Step 5: Monitor & Iterate
- Monitor match quality
- Collect user feedback
- Tune prompts and scoring formula

---

## Success Metrics

### Quality Metrics
- **Match relevance**: % of matches user accepts (target: >60%)
- **False positive rate**: % of matches user dismisses (target: <30%)
- **Coverage**: % of conversations with at least 1 match (target: >80%)

### Performance Metrics
- **Polling reliability**: % of 30s intervals that execute (target: 100%)
- **Latency**: Time from entity extraction to match display (target: <5s)
- **Contact coverage**: % of user's contacts considered (target: 100%)

### Explainability Metrics
- **User engagement**: % of users who expand match details (target: >40%)
- **Troubleshooting**: Time to identify why match was made (target: <10s)

---

## Future Enhancements (Post-v2)

1. **Incremental matching**: Update matches as new entities arrive (not full re-match)
2. **Learning from feedback**: Use user actions (accept/dismiss) to improve matching
3. **Relationship integration**: Better use of relationship_scores data
4. **Multi-model ensemble**: Combine GPT with embedding-only matching
5. **A/B testing**: Test different prompts and scoring formulas

---

## Decisions Made

1. **Incremental vs Full Re-match**: ✅ **Full re-match** (for MVP)
   - Re-match all contacts each time entities are extracted
   - Simpler implementation, easier to debug
   - Can add incremental matching later if needed

2. **Match History Storage**: ✅ **Store every generation**
   - Enables timeline view of match evolution
   - Helps with troubleshooting and optimization
   - Can filter/aggregate later if storage becomes an issue

3. **Contact Limit for GPT**: ✅ **100 contacts** (after pre-filtering)
   - Balance between match quality and GPT costs
   - Pre-filtering ensures only most relevant contacts reach GPT
   - Can adjust based on performance/cost feedback

4. **Embedding Cache Strategy**: 
   - Store conversation embeddings in `conversations` table
   - Add `entity_embedding` column to cache conversation entity embeddings

---

## Next Steps

1. ✅ Review and approve this design
2. Fix polling bug (Phase 1)
3. Create conversation embedding function (Phase 2)
4. Update generate-matches function (Phase 3)
5. Add database migrations (Phase 4)
6. Update UI for explainability (Phase 5)
7. Test and iterate

---

## References

- Current implementation: `supabase/functions/generate-matches/index.ts`
- Embeddings function: `supabase/functions/embed-contacts/index.ts`
- Polling logic: `client/src/components/RecordingDrawer.tsx`
- Schema: `shared/schema.ts`

