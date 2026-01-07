# Matching Engine Schema

**Feature**: GCP-based Real-time Contact Matching Engine  
**Status**: Design Phase  
**Last Updated**: 2025-01-17

## Overview

The matching engine recommends contacts from a user's database based on conversation transcripts. It uses semantic embeddings, ML models, and rule-based filtering to score and rank matches in near real-time.

## Core Concepts

### Input Signals

**Conversation Entities** (from `conversation_entities` table):
- `entity_type`: `sector`, `stage`, `check_size`, `geo`, `persona`, `intent`, `tech_stack`, `industry`
- `value`: The extracted value (e.g., "B2B SaaS", "pre-seed", "$1M", "SF Bay Area")
- `confidence`: Extraction confidence score
- `context_snippet`: Surrounding transcript text

**Contact Data** (from `contacts` + `theses` tables):
- Contact metadata: name, company, title, location, contact types (LP/GP/Angel/etc.)
- Investment thesis: sectors, stages, check sizes, geos, personas, intents
- Relationship data: relationship scores, interaction history

**Conversation Context**:
- Transcript segments (recent 5-10 minutes)
- Participants mentioned
- Conversation title/description
- Calendar event context (if linked)

### Output Format

**Match Suggestions** (stored in `match_suggestions` table):
- `conversation_id`: Links to conversation
- `contact_id`: Recommended contact
- `score`: 1-3 star rating
- `reasons`: Array of matching criteria (e.g., `["sector: B2B SaaS", "stage: pre-seed", "geo: SF Bay Area"]`)
- `justification`: Human-readable explanation
- `status`: `pending` | `promised` | `intro_made`
- `confidence`: ML model confidence score (0-1)
- `semantic_similarity`: Embedding cosine similarity (0-1)
- `rule_score`: Rule-based matching score (0-1)

## Data Flow

### Real-time Path (Primary)

```
1. Transcript chunk (5s) → Extract entities → conversation_entities table
2. New entity inserted → Supabase Realtime trigger
3. Pub/Sub message → conversation-entities topic
4. Cloud Function triggered → Generate embeddings
5. Query Vertex AI Matching Engine → Find similar contacts
6. Score & rank matches (ML model + rules)
7. Insert/update match_suggestions table
8. Supabase Realtime → Frontend UI update (<1s total)
```

### Batch Path (ML Training)

```
1. BigQuery exports (daily): conversation_entities, contacts, theses, match_suggestions
2. Feature engineering pipeline → Training dataset
3. Vertex AI Training → Train/retrain model
4. Deploy model to Vertex AI Endpoint
5. Update matching function to use new model
```

## Storage Schema

### Firestore Collections

**`contact_embeddings/{contactId}`**:
```typescript
{
  contactId: string;
  embedding: number[]; // 768-dim vector (Vertex AI text-embedding)
  metadata: {
    sectors: string[];
    stages: string[];
    checkSizes: string[];
    geos: string[];
    personas: string[];
    lastUpdated: timestamp;
  };
  version: number; // For cache invalidation
}
```

**`conversation_embeddings/{conversationId}`**:
```typescript
{
  conversationId: string;
  entityEmbeddings: {
    [entityType: string]: number[]; // Embedding per entity type
  };
  combinedEmbedding: number[]; // Weighted combination
  lastUpdated: timestamp;
}
```

**`matching_cache/{userId}/{conversationId}`**:
```typescript
{
  conversationId: string;
  matches: Array<{
    contactId: string;
    score: number;
    reasons: string[];
    timestamp: timestamp;
  }>;
  expiresAt: timestamp;
}
```

### BigQuery Tables (for ML Training)

**`matching_training_data`**:
```sql
CREATE TABLE matching_training_data (
  conversation_id STRING,
  contact_id STRING,
  entity_types ARRAY<STRING>,
  entity_values ARRAY<STRING>,
  contact_sectors ARRAY<STRING>,
  contact_stages ARRAY<STRING>,
  contact_check_sizes ARRAY<STRING>,
  contact_geos ARRAY<STRING>,
  actual_score INT64, -- 0 (no match) or 1-3 (match quality)
  semantic_similarity FLOAT64,
  rule_score FLOAT64,
  created_at TIMESTAMP
);
```

**`matching_features`** (feature engineering output):
```sql
CREATE TABLE matching_features (
  conversation_id STRING,
  contact_id STRING,
  feature_vector ARRAY<FLOAT64>, -- Normalized features
  label INT64, -- 0-3 (target for training)
  created_at TIMESTAMP
);
```

## API Contracts

### Matching API (Cloud Function)

**Endpoint**: `POST /match`

**Request**:
```typescript
{
  conversationId: string;
  userId: string;
  entities: Array<{
    type: string;
    value: string;
    confidence?: number;
  }>;
  options?: {
    maxResults?: number; // Default: 10
    minScore?: number; // Default: 1
    useCache?: boolean; // Default: true
  };
}
```

**Response**:
```typescript
{
  matches: Array<{
    contactId: string;
    score: number; // 1-3
    reasons: string[];
    justification: string;
    confidence: number; // 0-1
    semanticSimilarity: number; // 0-1
    ruleScore: number; // 0-1
  }>;
  processingTime: number; // milliseconds
  cached: boolean;
}
```

### Embedding API (Cloud Function)

**Endpoint**: `POST /embed`

**Request**:
```typescript
{
  text: string;
  type: 'conversation' | 'contact' | 'thesis';
}
```

**Response**:
```typescript
{
  embedding: number[]; // 768-dim vector
  model: string; // e.g., "text-embedding-004"
}
```

## Matching Algorithm

### Scoring Formula

```
final_score = (
  semantic_similarity * 0.5 +
  rule_score * 0.3 +
  ml_model_score * 0.2
) * relationship_boost

where:
- semantic_similarity: Cosine similarity of embeddings (0-1)
- rule_score: Rule-based matching (stage/geo/sector overlap) (0-1)
- ml_model_score: Trained ML model prediction (0-1)
- relationship_boost: 1.0 (no relationship) to 1.5 (strong relationship)
```

### Star Rating Mapping

- **3 stars**: final_score >= 0.75
- **2 stars**: final_score >= 0.50
- **1 star**: final_score >= 0.25

### Rule-Based Matching

**Stage Matching**:
- Exact match: +0.4
- Adjacent stage (pre-seed ↔ seed): +0.2
- Range overlap: +0.1

**Sector Matching**:
- Exact match: +0.3
- Related sector (AI ↔ ML): +0.15

**Geo Matching**:
- Exact match: +0.2
- Same region (SF ↔ Bay Area): +0.1

**Check Size Matching**:
- Overlap in range: +0.2
- Adjacent range: +0.1

## ML Model Architecture

### Training Data

- **Positive examples**: Historical `match_suggestions` with score >= 2
- **Negative examples**: Contacts not matched (or score = 0)
- **Features**: 
  - Embedding similarities (cosine)
  - Rule-based scores
  - Contact metadata (one-hot encoded)
  - Relationship scores
  - Temporal features (last interaction, etc.)

### Model Type

- **Phase 1**: Gradient Boosting (XGBoost) via Vertex AI AutoML
- **Future**: Deep learning model (TensorFlow) for complex patterns

### Training Pipeline

1. Extract features from BigQuery
2. Split train/validation/test (70/15/15)
3. Train model via Vertex AI Training
4. Evaluate on test set
5. Deploy to Vertex AI Endpoint
6. A/B test against current model
7. Roll out if improvement > 5%

## Performance Requirements

- **Latency**: < 1 second (p95)
- **Throughput**: 100 requests/second
- **Accuracy**: > 80% precision for 3-star matches
- **Cache Hit Rate**: > 70% for repeated queries
- **Cost**: < $0.01 per match request

## Security & Privacy

- **Data Isolation**: All queries scoped to `userId`
- **RLS**: Supabase RLS still enforced on `match_suggestions`
- **Encryption**: Embeddings encrypted at rest in Firestore
- **Access Control**: Cloud Functions validate JWT from Supabase
- **Audit Logging**: All matching requests logged to Cloud Logging

## Migration Notes

- Existing `match_suggestions` table schema remains unchanged
- New fields (`confidence`, `semantic_similarity`, `rule_score`) added as optional
- Backward compatible: old matches work, new matches have enhanced metadata
- Gradual rollout: 10% → 50% → 100% of traffic

