# Recommendation System API Schema

**Feature**: GCP Matching Engine API  
**Status**: Design Phase  
**Last Updated**: 2025-01-17

## Overview

This document defines the API contracts for the GCP-based matching engine. The API is implemented as Cloud Functions and provides real-time contact recommendations based on conversation entities.

## Base URL

- **Production**: `https://us-central1-<PROJECT_ID>.cloudfunctions.net`
- **Development**: `https://us-central1-<PROJECT_ID>.cloudfunctions.net` (with `env=dev`)

## Authentication

All requests require a Supabase JWT token:

```
Authorization: Bearer <supabase_jwt_token>
```

The Cloud Function validates the token and extracts `userId` from claims.

## Endpoints

### 1. Match Contacts

**Endpoint**: `POST /match-contacts`

**Description**: Generate contact recommendations for a conversation based on extracted entities.

**Request Body**:
```typescript
{
  conversationId: string;
  entities: Array<{
    type: 'sector' | 'stage' | 'check_size' | 'geo' | 'persona' | 'intent' | 'tech_stack' | 'industry';
    value: string;
    confidence?: number; // 0-1, optional
  }>;
  options?: {
    maxResults?: number; // Default: 10, Max: 50
    minScore?: number; // Default: 1 (1-3 stars)
    includeReasons?: boolean; // Default: true
    useCache?: boolean; // Default: true
    forceRefresh?: boolean; // Default: false
  };
}
```

**Response**:
```typescript
{
  matches: Array<{
    contactId: string;
    contactName: string;
    score: number; // 1-3
    reasons: string[];
    justification: string;
    confidence: number; // 0-1, ML model confidence
    semanticSimilarity: number; // 0-1, embedding similarity
    ruleScore: number; // 0-1, rule-based score
    metadata?: {
      company?: string;
      title?: string;
      location?: string;
    };
  }>;
  metadata: {
    processingTime: number; // milliseconds
    cached: boolean;
    totalContactsSearched: number;
    modelVersion: string;
  };
}
```

**Error Response**:
```typescript
{
  error: string;
  code: 'UNAUTHORIZED' | 'INVALID_REQUEST' | 'PROCESSING_ERROR' | 'RATE_LIMITED';
  details?: any;
}
```

**Example**:
```bash
curl -X POST https://us-central1-xxx.cloudfunctions.net/match-contacts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "entities": [
      {"type": "sector", "value": "B2B SaaS"},
      {"type": "stage", "value": "pre-seed"},
      {"type": "tech_stack", "value": "AI/ML"}
    ],
    "options": {
      "maxResults": 10,
      "minScore": 2
    }
  }'
```

---

### 2. Generate Embeddings

**Endpoint**: `POST /generate-embeddings`

**Description**: Generate embeddings for text (conversation entities, contact descriptions, etc.).

**Request Body**:
```typescript
{
  texts: string[];
  type: 'conversation' | 'contact' | 'thesis';
}
```

**Response**:
```typescript
{
  embeddings: Array<{
    text: string;
    embedding: number[]; // 768-dim vector
    model: string; // e.g., "text-embedding-004"
  }>;
}
```

**Example**:
```bash
curl -X POST https://us-central1-xxx.cloudfunctions.net/generate-embeddings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["B2B SaaS pre-seed AI/ML"],
    "type": "conversation"
  }'
```

---

### 3. Batch Update Contact Embeddings

**Endpoint**: `POST /batch-update-embeddings`

**Description**: Update embeddings for multiple contacts (used for initial sync and periodic refresh).

**Request Body**:
```typescript
{
  contactIds: string[];
  forceRefresh?: boolean; // Default: false
}
```

**Response**:
```typescript
{
  updated: number;
  failed: number;
  errors?: Array<{
    contactId: string;
    error: string;
  }>;
}
```

---

### 4. Health Check

**Endpoint**: `GET /health`

**Description**: Check API health and version.

**Response**:
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: {
    vertexAI: 'up' | 'down';
    firestore: 'up' | 'down';
    pubsub: 'up' | 'down';
  };
  timestamp: string; // ISO 8601
}
```

---

## Pub/Sub Topics

### `conversation-entities`

**Message Format**:
```typescript
{
  conversationId: string;
  userId: string;
  entities: Array<{
    type: string;
    value: string;
    confidence?: number;
  }>;
  timestamp: string; // ISO 8601
}
```

**Trigger**: Cloud Function `match-contacts-trigger` processes these messages for real-time matching.

---

## Rate Limits

- **Match Contacts**: 100 requests/minute per user
- **Generate Embeddings**: 1000 requests/minute per user
- **Batch Update**: 10 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing JWT token |
| `INVALID_REQUEST` | 400 | Malformed request body |
| `PROCESSING_ERROR` | 500 | Internal processing error |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `SERVICE_UNAVAILABLE` | 503 | GCP service temporarily unavailable |

---

## Versioning

API version is included in the function name:
- `match-contacts-v1`
- `match-contacts-v2` (future)

Version is also returned in response metadata.

---

## Monitoring & Observability

All requests are logged to Cloud Logging with:
- Request ID (for tracing)
- User ID
- Processing time
- Error details (if any)
- Model version used

Metrics exported to Cloud Monitoring:
- Request count
- Latency (p50, p95, p99)
- Error rate
- Cache hit rate
- Model prediction distribution

