# Build and Run Guide: GCP Matching Engine

**Feature**: GCP-based Real-time Contact Matching  
**Status**: Development Guide  
**Last Updated**: 2025-01-17

## Prerequisites

- Google Cloud Platform account
- GCP project with billing enabled
- `gcloud` CLI installed and configured
- Node.js 20+ installed
- Supabase project (for integration)

## Initial Setup

### 1. Create GCP Project

```bash
# Create new project
gcloud projects create social-graph-matching \
  --name="Social Graph Matching Engine"

# Set as default project
gcloud config set project social-graph-matching

# Enable billing (via console or API)
```

### 2. Enable Required APIs

```bash
# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable Firestore API
gcloud services enable firestore.googleapis.com

# Enable Pub/Sub API
gcloud services enable pubsub.googleapis.com

# Enable BigQuery API
gcloud services enable bigquery.googleapis.com

# Enable Cloud Build API (for deployments)
gcloud services enable cloudbuild.googleapis.com
```

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create matching-engine \
  --display-name="Matching Engine Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding social-graph-matching \
  --member="serviceAccount:matching-engine@social-graph-matching.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding social-graph-matching \
  --member="serviceAccount:matching-engine@social-graph-matching.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding social-graph-matching \
  --member="serviceAccount:matching-engine@social-graph-matching.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

### 4. Create Firestore Database

```bash
# Create Firestore database (Native mode)
gcloud firestore databases create --region=us-central1
```

### 5. Create Pub/Sub Topic

```bash
# Create topic
gcloud pubsub topics create conversation-entities

# Create subscription (for testing)
gcloud pubsub subscriptions create conversation-entities-sub \
  --topic=conversation-entities
```

## Local Development

### 1. Clone/Setup Project

```bash
# Navigate to project directory
cd /path/to/Social_Graph_Jackson

# Create GCP functions directory
mkdir -p gcp/functions

# Install dependencies (if separate package.json)
cd gcp/functions
npm init -y
npm install @google-cloud/functions-framework @google-cloud/aiplatform @google-cloud/firestore @google-cloud/pubsub
```

### 2. Environment Variables

Create `.env.local`:

```bash
# GCP Configuration
GCP_PROJECT_ID=social-graph-matching
GCP_REGION=us-central1

# Supabase (for integration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vertex AI
VERTEX_AI_LOCATION=us-central1
EMBEDDING_MODEL=text-embedding-004

# Firestore
FIRESTORE_DATABASE_ID=(default)
```

### 3. Run Locally

```bash
# Install Functions Framework
npm install -g @google-cloud/functions-framework

# Run function locally
functions-framework --target=matchContacts --port=8080

# Test with curl
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "conversationId": "test_123",
    "entities": [
      {"type": "sector", "value": "B2B SaaS"}
    ]
  }'
```

## Deployment

### 1. Deploy Cloud Functions

```bash
# Deploy match-contacts function
gcloud functions deploy match-contacts \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./gcp/functions \
  --entry-point=matchContacts \
  --trigger-http \
  --allow-unauthenticated \
  --memory=1GB \
  --timeout=60s \
  --set-env-vars="GCP_PROJECT_ID=social-graph-matching,SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=..."

# Deploy match-contacts-trigger (Pub/Sub)
gcloud functions deploy match-contacts-trigger \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./gcp/functions \
  --entry-point=matchContactsTrigger \
  --trigger-topic=conversation-entities \
  --memory=512MB \
  --timeout=30s

# Deploy generate-embeddings
gcloud functions deploy generate-embeddings \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=./gcp/functions \
  --entry-point=generateEmbeddings \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=30s
```

### 2. Set Up Vertex AI Matching Engine

```bash
# Create Matching Engine index (via Python script)
# See: gcp/scripts/create_matching_index.py

# Deploy index endpoint
gcloud ai index-endpoints create \
  --display-name="contact-matching-endpoint" \
  --region=us-central1
```

### 3. Set Up BigQuery

```bash
# Create dataset
bq mk --dataset social-graph-matching:matching_training

# Create tables (via SQL)
bq query --use_legacy_sql=false < gcp/sql/create_training_tables.sql
```

## Testing

### 1. Unit Tests

```bash
cd gcp/functions
npm test
```

### 2. Integration Tests

```bash
# Test matching API
curl -X POST https://us-central1-social-graph-matching.cloudfunctions.net/match-contacts \
  -H "Authorization: Bearer <supabase-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_123",
    "entities": [
      {"type": "sector", "value": "B2B SaaS"},
      {"type": "stage", "value": "pre-seed"}
    ]
  }'
```

### 3. Load Testing

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -p test_request.json \
  https://us-central1-social-graph-matching.cloudfunctions.net/match-contacts
```

## Monitoring

### 1. View Logs

```bash
# Cloud Function logs
gcloud functions logs read match-contacts --limit=50

# Pub/Sub logs
gcloud logging read "resource.type=pubsub_subscription" --limit=50
```

### 2. View Metrics

```bash
# Open Cloud Monitoring dashboard
# Or use gcloud:
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_count"'
```

## Troubleshooting

### Common Issues

**Function timeout**:
- Increase timeout: `--timeout=120s`
- Optimize code (reduce API calls)
- Use caching

**Authentication errors**:
- Verify JWT token is valid
- Check service account permissions
- Verify Supabase service role key

**Matching Engine errors**:
- Verify index is deployed
- Check index endpoint status
- Verify embeddings are generated correctly

**Cost issues**:
- Enable caching (reduce API calls)
- Batch requests where possible
- Monitor usage in Cloud Console

## CI/CD

### GitHub Actions Example

```yaml
name: Deploy GCP Functions

on:
  push:
    branches: [main]
    paths:
      - 'gcp/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
      - run: |
          gcloud functions deploy match-contacts \
            --gen2 \
            --runtime=nodejs20 \
            --region=us-central1 \
            --source=./gcp/functions
```

## Cost Optimization

1. **Enable caching**: Reduce redundant API calls
2. **Batch processing**: Process multiple requests together
3. **Reserve capacity**: Use committed use discounts
4. **Monitor usage**: Set up billing alerts
5. **Optimize functions**: Reduce memory/timeout where possible

## Next Steps

- See `tasks/01_matching_engine_gcp.yml` for implementation tasks
- See `docs/content/MATCHING_ENGINE_SCHEMA.md` for data schema
- See `docs/planning/MATCHING_ENGINE_ARCHITECTURE.md` for system design

