# Matching Engine Architecture

**Feature**: GCP-based Real-time Contact Matching  
**Status**: Design Phase  
**Last Updated**: 2025-01-17

## Overview

The matching engine is a GCP-based system that provides near real-time contact recommendations based on conversation transcripts. It uses semantic embeddings, ML models, and rule-based filtering to score and rank matches.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING APP (Supabase)                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Conversation Recording                              │   │
│  │  → Extract Entities → conversation_entities table   │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase Edge Function (generate-matches)          │   │
│  │  → Calls GCP Matching API (primary)                 │   │
│  │  → Falls back to GPT-3.5 (if GCP fails)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓ (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│                    GCP MATCHING ENGINE                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cloud Function: match-contacts                      │   │
│  │  - Validates JWT                                     │   │
│  │  - Generates embeddings (if needed)                  │   │
│  │  - Queries Matching Engine                           │   │
│  │  - Scores & ranks matches                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│        ┌───────────────┴───────────────┐                   │
│        ↓                               ↓                   │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ Vertex AI    │              │ Firestore   │            │
│  │ Matching     │              │ (Embeddings │            │
│  │ Engine       │              │  Cache)     │            │
│  └──────────────┘              └──────────────┘            │
│        │                               │                   │
│        └───────────────┬───────────────┘                   │
│                        ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ML Model (Vertex AI Endpoint)                      │   │
│  │  - Scores matches (0-1)                             │   │
│  │  - Trained on historical data                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Results → Supabase match_suggestions table        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Cloud Functions

**`match-contacts`** (Primary):
- **Trigger**: HTTP (from Supabase Edge Function)
- **Runtime**: Node.js 20
- **Memory**: 1GB
- **Timeout**: 60s
- **Responsibilities**:
  - Validate JWT token
  - Generate/retrieve embeddings
  - Query Vertex AI Matching Engine
  - Score matches (ML + rules)
  - Return ranked results

**`match-contacts-trigger`** (Real-time):
- **Trigger**: Pub/Sub (`conversation-entities` topic)
- **Runtime**: Node.js 20
- **Memory**: 512MB
- **Timeout**: 30s
- **Responsibilities**:
  - Process entity events in real-time
  - Generate matches automatically
  - Update Supabase via service account

**`generate-embeddings`**:
- **Trigger**: HTTP
- **Runtime**: Node.js 20
- **Memory**: 512MB
- **Timeout**: 30s
- **Responsibilities**:
  - Call Vertex AI Text Embeddings API
  - Cache embeddings in Firestore
  - Batch processing support

**`batch-update-embeddings`**:
- **Trigger**: Cloud Scheduler (daily)
- **Runtime**: Node.js 20
- **Memory**: 2GB
- **Timeout**: 540s
- **Responsibilities**:
  - Refresh all contact embeddings
  - Update Matching Engine index
  - Handle errors gracefully

### 2. Vertex AI Services

**Text Embeddings API**:
- Model: `text-embedding-004`
- Dimensions: 768
- Use case: Generate embeddings for conversations and contacts
- Cost: ~$0.0001 per 1K tokens

**Matching Engine**:
- Type: Vector similarity search
- Index: Contact embeddings (pre-computed)
- Query: Conversation embeddings (real-time)
- Top-K: 50 candidates per query
- Latency: <100ms

**Training Service**:
- Model type: XGBoost (Phase 1)
- Training data: BigQuery exports
- AutoML: Vertex AI AutoML Tables
- Deployment: Vertex AI Endpoint
- Retraining: Weekly (initially)

### 3. Firestore

**Collections**:
- `contact_embeddings/{contactId}`: Pre-computed contact embeddings
- `conversation_embeddings/{conversationId}`: Real-time conversation embeddings
- `matching_cache/{userId}/{conversationId}`: Cached match results

**Indexes**:
- Composite index on `contact_embeddings` for efficient queries
- TTL on cache collections (1 hour)

### 4. Pub/Sub

**Topic**: `conversation-entities`
- **Purpose**: Real-time event streaming
- **Subscribers**: `match-contacts-trigger` Cloud Function
- **Message format**: See `RECSYS_API_SCHEMA.md`

### 5. BigQuery

**Datasets**:
- `matching_training`: Training data exports
- `matching_features`: Engineered features

**Tables**:
- `conversation_entities_export`: Daily export from Supabase
- `contacts_export`: Daily export from Supabase
- `match_suggestions_export`: Historical matches
- `matching_training_data`: Combined training dataset
- `matching_features`: Feature-engineered dataset

### 6. Cloud Monitoring & Logging

**Metrics**:
- Request count (per endpoint)
- Latency (p50, p95, p99)
- Error rate
- Cache hit rate
- Model prediction distribution
- Cost per request

**Logs**:
- All API requests (with request ID)
- Errors and exceptions
- Model predictions (for debugging)
- Performance metrics

## Data Flow

### Real-time Matching Flow

1. **Entity Extraction** (Supabase):
   - Transcript → `extract-entities` Edge Function
   - Entities inserted into `conversation_entities` table

2. **Event Trigger** (Optional - for true real-time):
   - Supabase Realtime → Pub/Sub message
   - OR: Edge Function directly calls GCP API

3. **Matching** (GCP):
   - Cloud Function receives request
   - Generates/retrieves conversation embedding
   - Queries Matching Engine (finds top 50 candidates)
   - Scores each candidate (ML model + rules)
   - Ranks and filters (top 10, min score 1)

4. **Results** (Supabase):
   - Insert/update `match_suggestions` table
   - Supabase Realtime → Frontend UI update

**Total Latency**: < 1 second (p95)

### Batch Training Flow

1. **Data Export** (Daily):
   - Supabase → BigQuery (via scheduled export)
   - Tables: `conversation_entities`, `contacts`, `theses`, `match_suggestions`

2. **Feature Engineering**:
   - BigQuery SQL → Generate features
   - Store in `matching_features` table

3. **Model Training**:
   - Vertex AI AutoML → Train XGBoost model
   - Evaluate on test set
   - Deploy to Vertex AI Endpoint

4. **A/B Testing**:
   - Compare new model vs. current
   - Roll out if improvement > 5%

## Security

### Authentication
- All Cloud Functions validate Supabase JWT
- Extract `userId` from token claims
- Scope all queries to `userId`

### Authorization
- RLS still enforced in Supabase
- GCP functions use service account with minimal permissions
- No direct database access from GCP (only via Supabase API)

### Data Privacy
- Embeddings encrypted at rest (Firestore)
- No PII in logs (only IDs)
- Audit logging for all requests

## Scalability

### Current Limits
- **Contacts per user**: 10,000+ (no hard limit)
- **Requests per second**: 100 (per user)
- **Concurrent requests**: 1000 (total)

### Scaling Strategy
- **Horizontal**: Add more Cloud Function instances
- **Caching**: Firestore cache reduces API calls
- **Batch processing**: Pre-compute embeddings
- **Indexing**: Matching Engine handles large datasets

## Cost Estimation

**Per 1,000 match requests**:
- Cloud Functions: ~$0.10
- Vertex AI Matching Engine: ~$0.50
- Text Embeddings API: ~$0.20
- Firestore: ~$0.10
- **Total**: ~$0.90 per 1K requests

**Monthly (10K users, 10 matches/user/day)**:
- ~3M requests/month
- **Estimated cost**: ~$2,700/month

## Monitoring & Alerting

### Key Metrics
- **Latency**: Alert if p95 > 2s
- **Error rate**: Alert if > 1%
- **Cache hit rate**: Alert if < 50%
- **Cost**: Alert if > $5K/month

### Dashboards
- Cloud Monitoring dashboard
- Real-time request tracking
- Model performance metrics
- Cost breakdown

## Deployment Strategy

### Phase 1: MVP
1. Deploy Cloud Functions (dev environment)
2. Test with subset of users (10%)
3. Monitor performance and errors
4. Iterate on model

### Phase 2: Production
1. Deploy to production
2. Gradual rollout (10% → 50% → 100%)
3. Keep GPT fallback active
4. Monitor and optimize

### Phase 3: Optimization
1. Remove GPT fallback
2. Optimize caching
3. Fine-tune ML model
4. Scale infrastructure

