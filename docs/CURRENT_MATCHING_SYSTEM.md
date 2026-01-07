# Current Matching System Documentation

**Last Updated**: 2025-01-31  
**Status**: Production (OpenAI-based) + Design Docs (GCP-based, not implemented)

## Executive Summary

The codebase contains **two different matching system designs**:

1. **Currently Implemented**: OpenAI GPT-3.5-turbo based matching (simple, working)
2. **Documented but Not Implemented**: GCP/Vertex AI based matching engine (sophisticated, design phase)

This document describes both to provide full context for designing Matching Engine v2.

---

## Part 1: Currently Implemented System

### Overview

**Location**: `supabase/functions/generate-matches/index.ts`  
**Technology**: OpenAI GPT-3.5-turbo  
**Status**: ✅ Production  
**Trigger**: Polling-based (every 30 seconds during recording)

### How It Works

#### 1. Input Data

**Conversation Entities** (from `conversation_entities` table):
- Extracted by `extract-entities` Edge Function
- Types: `sector`, `stage`, `check_size`, `geo`, `persona`, `intent`, `tech_stack`, `industry`, `person_name`
- Stored with `value`, `confidence`, `context_snippet`

**Contacts** (from `contacts` + `theses` tables):
- Contact metadata: name, company, title, location
- Investment thesis: sectors, stages, check sizes, geos, personas, intents
- Limited to **100 contacts per request** (to avoid timeout)

#### 2. Matching Process

**Step 1: Name Matching** (Rule-based)
- Filters entities for `person_name` type
- Matches mentioned names against contact names
- Uses fuzzy matching (handles first/last name variations)
- **Score**: 3 stars (highest priority)

**Step 2: AI Matching** (OpenAI GPT-3.5-turbo)
- If other entities exist (non-person-name), calls OpenAI
- Sends entity summary + contact list (max 100 contacts)
- System prompt instructs GPT to score matches (1-3 stars)
- **Timeout**: 25 seconds
- **Model**: `gpt-3.5-turbo`
- **Temperature**: 0.5

**Step 3: Merge Results**
- Combines name matches + AI matches
- Removes duplicates (name matches take priority)
- Inserts into `match_suggestions` table

#### 3. Scoring Criteria (as instructed to GPT)

- **3 stars**: Strong match (3+ overlapping criteria OR perfect fit for key criteria)
- **2 stars**: Medium match (2 overlapping criteria OR good fit on important criteria)
- **1 star**: Weak match (1 overlapping criterion OR relevant but not perfect fit)

**Match on ANY of these**:
- Investment stage (pre-seed, seed, Series A, etc.)
- Sector/vertical (B2B SaaS, fintech, healthcare, AI, etc.)
- Check size ($1M, $5M, etc.)
- Geography (SF Bay Area, NYC, remote, etc.)
- Persona type (GP, angel, family office, etc.)

#### 4. Output Format

**`match_suggestions` table**:
```typescript
{
  conversation_id: string;
  contact_id: string;
  score: number; // 1-3
  reasons: string[]; // e.g., ["stage: pre-seed", "sector: B2B SaaS"]
  justification: string; // Human-readable explanation
  status: 'pending' | 'promised' | 'intro_made';
}
```

### Current Limitations

1. **Polling-based**: Runs every 30 seconds (not real-time)
2. **Contact limit**: Only processes 100 contacts per request
3. **Timeout risk**: 25-second timeout may fail for large contact lists
4. **No semantic search**: Relies on GPT's understanding, not embeddings
5. **No ML model**: No trained model, just GPT prompt engineering
6. **No caching**: Every request calls OpenAI
7. **Cost**: OpenAI API costs scale with contact count
8. **No incremental updates**: Full re-matching each time

### Trigger Flow

**Current Implementation** (from `RecordingDrawer.tsx`):
```
Recording → Transcript segments (every 5s)
  ↓
Polling interval (every 30s):
  1. Extract entities (if transcript updated)
  2. Generate matches (if entities exist)
  ↓
Results → match_suggestions table
  ↓
Supabase Realtime → UI updates
```

### Code Reference

**Main Function**: `supabase/functions/generate-matches/index.ts`
- Lines 1-311: Full implementation
- Lines 72-124: Name matching logic
- Lines 132-240: OpenAI matching logic
- Lines 242-260: Result merging

**Frontend Trigger**: `client/src/components/RecordingDrawer.tsx`
- Lines 322-357: Polling logic (30-second intervals)

---

## Part 2: Documented GCP-Based System (Not Implemented)

### Overview

**Status**: 📋 Design Phase (not implemented)  
**Technology**: GCP Cloud Functions + Vertex AI + Firestore  
**Documentation**: Extensive design docs exist, but no implementation

### Key Documents

1. **`docs/planning/MATCHING_ENGINE_ARCHITECTURE.md`**
   - System architecture
   - Component design (Cloud Functions, Vertex AI, Firestore)
   - Data flow diagrams
   - Cost estimates (~$2,700/month for 10K users)

2. **`docs/content/MATCHING_ENGINE_SCHEMA.md`**
   - Data schema (Firestore collections, BigQuery tables)
   - API contracts
   - Matching algorithm (scoring formula)
   - ML model architecture

3. **`docs/content/MATCHING_SIGNALS_AND_FEATURES.md`**
   - Input signals (entities, contacts, relationships)
   - Feature engineering (embeddings, rule-based, categorical)
   - ML model features
   - Feature importance

4. **`docs/planning/REALTIME_MATCHING_ARCHITECTURE.md`**
   - Real-time streaming architecture
   - Incremental matching
   - Pub/Sub event flow
   - Performance requirements (<1s latency)

5. **`docs/content/RECSYS_API_SCHEMA.md`**
   - API endpoint specifications
   - Request/response formats
   - Rate limits
   - Error codes

6. **`docs/workflow/BUILD_AND_RUN_GCP_MATCHING.md`**
   - Deployment guide
   - GCP setup instructions
   - Local development setup

### Proposed Architecture

**Components**:
- **Cloud Functions**: `match-contacts`, `match-contacts-trigger`, `generate-embeddings`
- **Vertex AI**: Text Embeddings API, Matching Engine, ML Training
- **Firestore**: Embedding cache, match cache
- **Pub/Sub**: Real-time event streaming
- **BigQuery**: ML training data

**Matching Algorithm**:
```
final_score = (
  semantic_similarity * 0.5 +
  rule_score * 0.3 +
  ml_model_score * 0.2
) * relationship_boost
```

**Features**:
- Semantic embeddings (768-dim vectors)
- Rule-based matching (stage/geo/sector overlap)
- ML model (XGBoost, trained on historical data)
- Relationship boost (1.0-1.5x multiplier)
- Real-time matching (<1s latency)
- Caching (Firestore)

### Why Not Implemented?

The GCP system is more sophisticated but:
- Requires GCP setup and costs
- More complex to deploy and maintain
- Current OpenAI solution works for MVP
- No clear ROI yet for the added complexity

---

## Part 3: Current System Workflow

### End-to-End Flow

```
1. User starts recording
   ↓
2. Audio chunks (5s) → Transcription → conversation_segments
   ↓
3. Every 30 seconds (polling):
   a. Extract entities → conversation_entities
   b. Generate matches → match_suggestions
   ↓
4. UI updates via Supabase Realtime subscription
```

### Database Tables

**`conversation_entities`**:
- Stores extracted entities from transcripts
- Types: sector, stage, check_size, geo, persona, intent, tech_stack, industry, person_name
- Linked to `conversation_id`

**`match_suggestions`**:
- Stores match recommendations
- Fields: `conversation_id`, `contact_id`, `score` (1-3), `reasons`, `justification`, `status`
- Linked to both `conversations` and `contacts`

**`contacts`**:
- User's contact database
- Includes basic info + investment thesis (via `theses` table)

### Frontend Integration

**Component**: `RecordingDrawer.tsx`
- Subscribes to `conversation_segments` (real-time transcript)
- Polls every 30s for entity extraction + matching
- Displays matches in UI with star ratings
- Shows toast notifications for high-value matches (3 stars)

**Hook**: `useMatches.ts` (if exists)
- Fetches matches for a conversation
- Manages match status updates

---

## Part 4: Key Differences: Current vs. Documented

| Aspect | Current (Implemented) | Documented (GCP Design) |
|--------|----------------------|-------------------------|
| **Technology** | OpenAI GPT-3.5-turbo | Vertex AI + ML Models |
| **Latency** | ~30s (polling) | <1s (real-time) |
| **Contact Limit** | 100 per request | No limit (vector search) |
| **Matching Method** | GPT prompt engineering | Embeddings + ML + Rules |
| **Caching** | None | Firestore cache |
| **Cost Model** | Per OpenAI API call | GCP infrastructure |
| **Scalability** | Limited by OpenAI rate limits | Highly scalable |
| **Real-time** | Polling (30s intervals) | Event-driven (Pub/Sub) |
| **ML Training** | None | BigQuery + Vertex AI |
| **Incremental Updates** | Full re-matching | Incremental matching |

---

## Part 5: What Works Well (Current System)

✅ **Simple and reliable**: OpenAI API is straightforward  
✅ **Good match quality**: GPT-3.5 understands context well  
✅ **Name matching**: Special handling for mentioned names works  
✅ **Fast to implement**: No infrastructure setup needed  
✅ **Easy to debug**: Simple code, clear flow  

## Part 6: What Needs Improvement

❌ **Not real-time**: 30-second polling delay  
❌ **Contact limit**: 100 contacts max per request  
❌ **Cost**: OpenAI costs scale with usage  
❌ **No learning**: No ML model improvement over time  
❌ **No semantic search**: Can't find nuanced matches  
❌ **Timeout risk**: 25s timeout may fail  
❌ **No caching**: Redundant API calls  

---

## Part 7: Recommendations for v2 Design

### Option A: Enhance Current System
- Add caching (Supabase table for match cache)
- Increase contact limit (batch processing)
- Add real-time triggers (Supabase Realtime webhooks)
- Keep OpenAI but optimize prompts

### Option B: Implement GCP System
- Follow documented architecture
- Deploy Cloud Functions
- Set up Vertex AI Matching Engine
- Implement real-time Pub/Sub flow

### Option C: Hybrid Approach
- Keep OpenAI for matching logic
- Add embeddings for semantic search (pre-filter contacts)
- Add caching layer
- Add real-time triggers
- Gradually migrate to GCP if needed

---

## References

### Implementation Files
- `supabase/functions/generate-matches/index.ts` - Current matching logic
- `client/src/components/RecordingDrawer.tsx` - Frontend trigger
- `shared/schema.ts` - Database schema (lines 164-190)

### Documentation Files
- `docs/planning/MATCHING_ENGINE_ARCHITECTURE.md` - GCP architecture
- `docs/content/MATCHING_ENGINE_SCHEMA.md` - Data schema & API
- `docs/content/MATCHING_SIGNALS_AND_FEATURES.md` - Features & signals
- `docs/planning/REALTIME_MATCHING_ARCHITECTURE.md` - Real-time design
- `docs/content/RECSYS_API_SCHEMA.md` - API specifications
- `docs/workflow/BUILD_AND_RUN_GCP_MATCHING.md` - Deployment guide

---

## Next Steps for v2 Design

1. **Decide on approach**: Enhance current vs. GCP vs. Hybrid
2. **Define requirements**: Real-time? Scale? Cost targets?
3. **Design architecture**: Based on chosen approach
4. **Create implementation plan**: Phased rollout
5. **Document v2 system**: Architecture, API, data flow

