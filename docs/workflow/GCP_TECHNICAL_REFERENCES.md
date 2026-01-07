# GCP Technical References

**Feature**: GCP Matching Engine - Official Documentation Links  
**Last Updated**: 2025-01-17

This document provides official Google Cloud documentation links for all technical tools and services used in the Matching Engine implementation.

## Core Services

### 1. Vertex AI Text Embeddings API

**Purpose**: Generate 768-dimensional embeddings for conversations and contacts

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings
- **API Reference**: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.publishers.models/predict
- **Model Details**: https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/embeddings-models
- **Pricing**: https://cloud.google.com/vertex-ai/pricing#generative_ai_models
- **Node.js Client**: https://cloud.google.com/nodejs/docs/reference/aiplatform/latest

**Key Resources**:
- Model: `text-embedding-004` (768 dimensions)
- Cost: ~$0.0001 per 1K tokens
- Rate limits: See API quotas

---

### 2. Vertex AI Matching Engine

**Purpose**: Vector similarity search for finding similar contacts

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/vertex-ai/docs/matching-engine/overview
- **Getting Started**: https://cloud.google.com/vertex-ai/docs/matching-engine/getting-started
- **Create Index**: https://cloud.google.com/vertex-ai/docs/matching-engine/create-index
- **Deploy Index**: https://cloud.google.com/vertex-ai/docs/matching-engine/deploy-index
- **Query Index**: https://cloud.google.com/vertex-ai/docs/matching-engine/query-index
- **API Reference**: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.indexes
- **Pricing**: https://cloud.google.com/vertex-ai/pricing#matching_engine

**Key Resources**:
- Index type: Vector similarity search
- Dimensions: 768 (for text-embedding-004)
- Query latency: <100ms (target)
- Alternative: Consider Vertex AI Vector Search (newer service)

---

### 3. Vertex AI AutoML Tables

**Purpose**: Train XGBoost model for match scoring

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/vertex-ai/docs/tabular-data/overview
- **AutoML Tables**: https://cloud.google.com/vertex-ai/docs/tabular-data/train-automl-model
- **Training Guide**: https://cloud.google.com/vertex-ai/docs/tabular-data/training-overview
- **Deploy Model**: https://cloud.google.com/vertex-ai/docs/tabular-data/deploy-model
- **Predictions**: https://cloud.google.com/vertex-ai/docs/tabular-data/online-predictions
- **API Reference**: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.models
- **Pricing**: https://cloud.google.com/vertex-ai/pricing#automl_tables

**Key Resources**:
- Model type: XGBoost (via AutoML)
- Training data: BigQuery tables
- Deployment: Vertex AI Endpoint
- Prediction latency: <100ms (target)

---

### 4. Cloud Functions (Gen 2)

**Purpose**: Serverless functions for matching API and triggers

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/functions/docs
- **Gen 2 Overview**: https://cloud.google.com/functions/docs/2nd-gen/overview
- **Getting Started**: https://cloud.google.com/functions/docs/2nd-gen/create-deploy-http
- **Node.js Guide**: https://cloud.google.com/functions/docs/2nd-gen/writing-functions
- **HTTP Triggers**: https://cloud.google.com/functions/docs/2nd-gen/calling-http-functions
- **Pub/Sub Triggers**: https://cloud.google.com/functions/docs/2nd-gen/calling-pubsub
- **Environment Variables**: https://cloud.google.com/functions/docs/configuring/env-var
- **Secrets**: https://cloud.google.com/functions/docs/configuring/secrets
- **Monitoring**: https://cloud.google.com/functions/docs/monitoring
- **Pricing**: https://cloud.google.com/functions/pricing

**Key Resources**:
- Runtime: Node.js 20
- Memory: 512MB - 2GB (configurable)
- Timeout: 30s - 540s (configurable)
- Cold start: ~1-2s (Gen 2 improved)

---

### 5. Firestore

**Purpose**: Store embeddings cache and matching results

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/firestore/docs
- **Getting Started**: https://cloud.google.com/firestore/docs/quickstart
- **Data Model**: https://cloud.google.com/firestore/docs/data-model
- **Queries**: https://cloud.google.com/firestore/docs/query-data/queries
- **Indexes**: https://cloud.google.com/firestore/docs/query-data/indexes
- **TTL (Time to Live)**: https://cloud.google.com/firestore/docs/manage-data/ttl
- **Security Rules**: https://cloud.google.com/firestore/docs/security/get-started
- **Node.js Client**: https://cloud.google.com/nodejs/docs/reference/firestore/latest
- **Pricing**: https://cloud.google.com/firestore/pricing

**Key Resources**:
- Mode: Native mode (recommended)
- Collections: contact_embeddings, conversation_embeddings, matching_cache
- Indexes: Composite indexes for queries
- TTL: 1 hour for cache collections

---

### 6. Cloud Pub/Sub

**Purpose**: Real-time event streaming for conversation entities

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/pubsub/docs
- **Getting Started**: https://cloud.google.com/pubsub/docs/quickstart-console
- **Concepts**: https://cloud.google.com/pubsub/docs/overview
- **Publishing Messages**: https://cloud.google.com/pubsub/docs/publisher
- **Subscribing**: https://cloud.google.com/pubsub/docs/subscriber
- **Push Subscriptions**: https://cloud.google.com/pubsub/docs/push
- **Pull Subscriptions**: https://cloud.google.com/pubsub/docs/pull
- **Node.js Client**: https://cloud.google.com/nodejs/docs/reference/pubsub/latest
- **Pricing**: https://cloud.google.com/pubsub/pricing

**Key Resources**:
- Topic: `conversation-entities`
- Message format: JSON
- Delivery: At-least-once
- Retention: 7 days (default)

---

### 7. BigQuery

**Purpose**: Data warehouse for ML training data

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/bigquery/docs
- **Getting Started**: https://cloud.google.com/bigquery/docs/quickstarts
- **SQL Reference**: https://cloud.google.com/bigquery/docs/reference/standard-sql
- **Data Transfer**: https://cloud.google.com/bigquery-transfer/docs
- **Scheduled Queries**: https://cloud.google.com/bigquery/docs/scheduled-queries
- **Export Data**: https://cloud.google.com/bigquery/docs/exporting-data
- **Node.js Client**: https://cloud.google.com/nodejs/docs/reference/bigquery/latest
- **Pricing**: https://cloud.google.com/bigquery/pricing

**Key Resources**:
- Dataset: `matching_training`
- Tables: matching_training_data, matching_features
- Exports: Daily from Supabase
- Quotas: See BigQuery quotas

---

### 8. Cloud Monitoring

**Purpose**: Metrics, dashboards, and alerting

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/monitoring/docs
- **Getting Started**: https://cloud.google.com/monitoring/docs/getting-started
- **Metrics**: https://cloud.google.com/monitoring/api/metrics
- **Dashboards**: https://cloud.google.com/monitoring/dashboards
- **Alerts**: https://cloud.google.com/monitoring/alerts
- **SLOs**: https://cloud.google.com/monitoring/slo
- **Pricing**: https://cloud.google.com/stackdriver/pricing

**Key Resources**:
- Metrics: Request count, latency, error rate, cache hit rate
- Alerts: Latency > 2s, error rate > 1%, cost > $5K/month
- Dashboards: Real-time request tracking

---

### 9. Cloud Logging

**Purpose**: Structured logging and request tracing

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/logging/docs
- **Getting Started**: https://cloud.google.com/logging/docs/getting-started
- **Logging Libraries**: https://cloud.google.com/logging/docs/reference/libraries
- **Structured Logging**: https://cloud.google.com/logging/docs/structured-logging
- **Log Queries**: https://cloud.google.com/logging/docs/view/logs-viewer-interface
- **Node.js Client**: https://cloud.google.com/nodejs/docs/reference/logging/latest
- **Pricing**: https://cloud.google.com/logging/pricing

**Key Resources**:
- Format: Structured JSON
- Fields: request_id, user_id, processing_time, error_details
- Retention: 30 days (default)
- Export: Can export to BigQuery

---

### 10. Cloud Scheduler

**Purpose**: Scheduled jobs (daily exports, batch updates)

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/scheduler/docs
- **Getting Started**: https://cloud.google.com/scheduler/docs/quickstart
- **Create Jobs**: https://cloud.google.com/scheduler/docs/create-job
- **HTTP Targets**: https://cloud.google.com/scheduler/docs/http-target
- **Pub/Sub Targets**: https://cloud.google.com/scheduler/docs/pubsub-target
- **Cron Syntax**: https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules
- **Pricing**: https://cloud.google.com/scheduler/pricing

**Key Resources**:
- Jobs: Daily exports (2 AM UTC), batch updates (3 AM UTC)
- Targets: HTTP (Cloud Functions), Pub/Sub
- Timezone: UTC

---

## Development Tools

### 11. Google Cloud CLI (gcloud)

**Purpose**: Command-line interface for GCP

**Official Documentation**:
- **Installation**: https://cloud.google.com/sdk/docs/install
- **Quickstart**: https://cloud.google.com/sdk/docs/quickstart
- **Reference**: https://cloud.google.com/sdk/gcloud/reference
- **Configuration**: https://cloud.google.com/sdk/docs/initializing

---

### 12. Cloud Build

**Purpose**: CI/CD for Cloud Functions

**Official Documentation**:
- **Main Docs**: https://cloud.google.com/build/docs
- **Getting Started**: https://cloud.google.com/build/docs/quickstart-build
- **Build Config**: https://cloud.google.com/build/docs/build-config
- **GitHub Integration**: https://cloud.google.com/build/docs/automating-builds/github

---

## Node.js Libraries

### 13. @google-cloud/aiplatform

**Purpose**: Vertex AI client library

**Documentation**:
- **NPM**: https://www.npmjs.com/package/@google-cloud/aiplatform
- **GitHub**: https://github.com/googleapis/nodejs-ai-platform
- **API Reference**: https://cloud.google.com/nodejs/docs/reference/aiplatform/latest

---

### 14. @google-cloud/firestore

**Purpose**: Firestore client library

**Documentation**:
- **NPM**: https://www.npmjs.com/package/@google-cloud/firestore
- **GitHub**: https://github.com/googleapis/nodejs-firestore
- **API Reference**: https://cloud.google.com/nodejs/docs/reference/firestore/latest

---

### 15. @google-cloud/pubsub

**Purpose**: Pub/Sub client library

**Documentation**:
- **NPM**: https://www.npmjs.com/package/@google-cloud/pubsub
- **GitHub**: https://github.com/googleapis/nodejs-pubsub
- **API Reference**: https://cloud.google.com/nodejs/docs/reference/pubsub/latest

---

### 16. @google-cloud/bigquery

**Purpose**: BigQuery client library

**Documentation**:
- **NPM**: https://www.npmjs.com/package/@google-cloud/bigquery
- **GitHub**: https://github.com/googleapis/nodejs-bigquery
- **API Reference**: https://cloud.google.com/nodejs/docs/reference/bigquery/latest

---

## Additional Resources

### Best Practices & Guides

- **GCP Architecture Center**: https://cloud.google.com/architecture
- **Serverless Best Practices**: https://cloud.google.com/functions/docs/bestpractices
- **ML Best Practices**: https://cloud.google.com/vertex-ai/docs/best-practices
- **Security Best Practices**: https://cloud.google.com/security/best-practices

### Pricing Calculators

- **GCP Pricing Calculator**: https://cloud.google.com/products/calculator
- **Vertex AI Pricing**: https://cloud.google.com/vertex-ai/pricing
- **Cloud Functions Pricing**: https://cloud.google.com/functions/pricing

### Support & Community

- **GCP Support**: https://cloud.google.com/support
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/google-cloud-platform
- **GitHub Issues**: https://github.com/googleapis
- **Discord**: https://discord.gg/googlecloud

### Training & Certifications

- **GCP Training**: https://cloud.google.com/training
- **Qwiklabs**: https://www.qwiklabs.com
- **Coursera**: https://www.coursera.org/googlecloud

---

## Quick Reference: Service Limits & Quotas

- **Vertex AI Quotas**: https://cloud.google.com/vertex-ai/docs/quotas
- **Cloud Functions Quotas**: https://cloud.google.com/functions/quotas
- **Firestore Quotas**: https://cloud.google.com/firestore/quotas
- **Pub/Sub Quotas**: https://cloud.google.com/pubsub/quotas
- **BigQuery Quotas**: https://cloud.google.com/bigquery/quotas

---

## Architecture Patterns

- **Event-Driven Architecture**: https://cloud.google.com/architecture/event-driven-architecture
- **Microservices Patterns**: https://cloud.google.com/architecture/microservices-on-gcp
- **ML Pipeline Patterns**: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning

---

**Note**: All links are to official Google Cloud documentation. Bookmark this page for quick reference during implementation.

