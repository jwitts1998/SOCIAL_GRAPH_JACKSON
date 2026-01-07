# Real-Time Matching Architecture

**Feature**: Real-Time Contact Matching During Conversations  
**Status**: Design Update  
**Last Updated**: 2025-01-17

## Use Case Update

**Original**: Batch matching every 30 seconds after entity extraction  
**New**: Real-time matching and insights as conversation flows

**Requirements**:
- Transcription happens in real-time (already working)
- Entity extraction happens in real-time (as transcript segments arrive)
- Matching happens in real-time (as entities are extracted)
- Insights appear continuously during conversation (not just at end)

## Architecture Changes

### Current Flow (30-second polling)
```
Audio (5s chunks) → Transcribe → conversation_segments
                                    ↓
                            [Wait 30 seconds]
                                    ↓
                            Extract Entities → conversation_entities
                                    ↓
                            [Wait 30 seconds]
                                    ↓
                            Generate Matches → match_suggestions
```

### New Flow (Real-time streaming)
```
Audio (5s chunks) → Transcribe → conversation_segments
                                    ↓ (immediate)
                            Extract Entities (streaming) → conversation_entities
                                    ↓ (immediate)
                            Generate Matches (incremental) → match_suggestions
                                    ↓ (immediate)
                            UI Updates (Supabase Realtime)
```

## Key Changes Required

### 1. Streaming Entity Extraction

**Current**: Batch extraction every 30 seconds  
**New**: Extract entities as transcript segments arrive

**Implementation**:
- Trigger entity extraction on each new `conversation_segments` INSERT
- Use Pub/Sub or Supabase Realtime trigger
- Extract entities from recent segments (last 1-2 minutes of transcript)
- Incrementally update `conversation_entities` table

**Edge Function**: `extract-entities-streaming`
- Triggered by: Supabase Realtime webhook or Pub/Sub
- Input: New transcript segments
- Output: New/updated entities
- Latency: < 2 seconds

### 2. Incremental Matching

**Current**: Full matching every 30 seconds  
**New**: Incremental matching as entities arrive

**Implementation**:
- Trigger matching on each new `conversation_entities` INSERT
- Use existing entities + new entity
- Update matches incrementally (add/update/remove)
- Maintain match scores as conversation evolves

**GCP Function**: `match-contacts-incremental`
- Triggered by: Pub/Sub (conversation-entities topic)
- Input: New entity + existing entities
- Output: Updated match suggestions
- Latency: < 1 second

### 3. Real-Time Updates

**Current**: Polling every 5 seconds  
**New**: Real-time via Supabase subscriptions

**Implementation**:
- Frontend already subscribes to `match_suggestions` table
- As matches are inserted/updated, UI updates immediately
- No polling needed

**Already Working**: Supabase Realtime subscriptions handle this

## Technical Approach

### Option A: Supabase Realtime Triggers (Recommended)

**Flow**:
1. New `conversation_segments` INSERT → Supabase Realtime trigger
2. Edge Function `extract-entities-streaming` called
3. New `conversation_entities` INSERT → Supabase Realtime trigger
4. Pub/Sub message → GCP `match-contacts-incremental`
5. Results → `match_suggestions` table
6. Supabase Realtime → Frontend UI update

**Pros**:
- Uses existing Supabase infrastructure
- Low latency (Supabase → Edge Function)
- Simple to implement

**Cons**:
- Requires Supabase Realtime webhooks (may need custom setup)

### Option B: Pub/Sub Streaming (More Scalable)

**Flow**:
1. New `conversation_segments` INSERT → Database trigger → Pub/Sub
2. Cloud Function `extract-entities-streaming` processes
3. New entities → Pub/Sub → `match-contacts-incremental`
4. Results → Supabase API → `match_suggestions` table
5. Supabase Realtime → Frontend UI update

**Pros**:
- Fully event-driven
- Highly scalable
- Decouples services

**Cons**:
- More complex setup
- Requires database triggers or change streams

### Option C: Hybrid (Best of Both)

**Flow**:
1. New `conversation_segments` INSERT → Supabase Realtime
2. Frontend detects new segment → Calls Edge Function `extract-entities-streaming`
3. Edge Function → Pub/Sub → GCP matching
4. Results → Supabase → Frontend via Realtime

**Pros**:
- Uses existing frontend patterns
- No database triggers needed
- Flexible

**Cons**:
- Requires frontend to trigger (not fully automatic)

## Recommended: Option A (Supabase Realtime + Edge Functions)

### Implementation Details

**1. Streaming Entity Extraction**

Edge Function: `extract-entities-streaming`
- Trigger: Supabase Realtime webhook (on `conversation_segments` INSERT)
- Process: Extract entities from recent segments (last 2 minutes)
- Output: Insert/update `conversation_entities`
- Latency: < 2 seconds

**2. Incremental Matching**

GCP Function: `match-contacts-incremental`
- Trigger: Pub/Sub (on `conversation_entities` INSERT)
- Process: 
  - Fetch existing entities for conversation
  - Generate/update conversation embedding
  - Query Matching Engine
  - Score matches (incremental update)
- Output: Insert/update `match_suggestions`
- Latency: < 1 second

**3. Real-Time UI Updates**

Frontend: Already implemented
- Supabase subscription to `match_suggestions`
- Updates UI automatically as matches arrive
- No changes needed

## Data Flow (Real-Time)

```
┌─────────────────────────────────────────────────────────┐
│  CONVERSATION (Real-time)                               │
└─────────────────────────────────────────────────────────┘
                    │
                    ↓ (5s chunks)
    ┌───────────────────────────────┐
    │  Transcribe Audio             │
    │  → conversation_segments      │
    └───────────────────────────────┘
                    │
                    ↓ (Supabase Realtime)
    ┌───────────────────────────────┐
    │  Extract Entities (streaming) │
    │  → conversation_entities      │
    └───────────────────────────────┘
                    │
                    ↓ (Pub/Sub)
    ┌───────────────────────────────┐
    │  Generate Embedding           │
    │  (incremental update)        │
    └───────────────────────────────┘
                    │
                    ↓
    ┌───────────────────────────────┐
    │  Query Matching Engine        │
    │  (incremental candidates)     │
    └───────────────────────────────┘
                    │
                    ↓
    ┌───────────────────────────────┐
    │  Score & Rank Matches         │
    │  (incremental update)         │
    └───────────────────────────────┘
                    │
                    ↓ (Supabase API)
    ┌───────────────────────────────┐
    │  Update match_suggestions     │
    └───────────────────────────────┘
                    │
                    ↓ (Supabase Realtime)
    ┌───────────────────────────────┐
    │  Frontend UI Update           │
    │  (immediate)                  │
    └───────────────────────────────┘
```

## Incremental Matching Logic

### Entity Accumulation

**Window**: Last 2 minutes of conversation
- Keep rolling window of entities
- As new entities arrive, add to window
- Remove entities older than 2 minutes

**Embedding Update**:
- Re-generate conversation embedding from current entity window
- Cache embedding (update when entities change)
- Use for similarity search

### Match Updates

**Incremental Scoring**:
- When new entity arrives, re-score all existing matches
- Add new matches if new entity creates new connections
- Remove matches if they no longer meet threshold
- Update match reasons/justification

**Match State**:
- Track match history (when added, when updated, when removed)
- Maintain match confidence over time
- Show "new" indicator for recently added matches

## Performance Requirements

**Latency Targets**:
- Entity extraction: < 2 seconds
- Matching: < 1 second
- Total (segment → match): < 3 seconds

**Throughput**:
- Handle 1 entity extraction per 5 seconds (per conversation)
- Handle 1 matching request per 5 seconds (per conversation)
- Scale to 1000 concurrent conversations

**Cost Optimization**:
- Cache embeddings (update only when entities change)
- Batch entity extraction (process multiple segments together)
- Incremental matching (only re-score affected matches)

## UI/UX Considerations

**Real-Time Indicators**:
- Show "analyzing..." indicator during processing
- Highlight new matches as they appear
- Show match confidence/recency
- Animate match additions/updates

**Match Evolution**:
- Show how match scores change over time
- Indicate when matches are "new" vs "updated"
- Allow user to see match history

**Insights Panel**:
- Real-time insights (not just matches)
- Entity extraction progress
- Matching confidence
- Conversation themes/summary

## Migration Path

**Phase 1**: Add streaming entity extraction
- Keep 30-second polling as fallback
- Test streaming extraction in parallel

**Phase 2**: Add incremental matching
- Keep batch matching as fallback
- Test incremental matching in parallel

**Phase 3**: Remove polling
- Switch to streaming-only
- Monitor performance and errors

## Next Steps

1. Update `extract-entities` Edge Function for streaming
2. Create `match-contacts-incremental` GCP Function
3. Set up Pub/Sub triggers
4. Update frontend to show real-time indicators
5. Test with real conversations

