# Matching Signals and Features

**Feature**: GCP Matching Engine - Feature Engineering  
**Status**: Design Phase  
**Last Updated**: 2025-01-17

## Overview

This document describes the signals (inputs) and features (engineered) used by the matching engine to score contact recommendations.

## Input Signals

### 1. Conversation Entities

**Source**: `conversation_entities` table

**Types**:
- `sector`: Industry sectors (e.g., "B2B SaaS", "Fintech", "Healthcare")
- `stage`: Investment stages (e.g., "pre-seed", "seed", "Series A")
- `check_size`: Investment amounts (e.g., "$1M", "$5M-$10M")
- `geo`: Geographic locations (e.g., "SF Bay Area", "NYC", "Remote")
- `persona`: Investor types (e.g., "GP", "Angel", "LP")
- `intent`: Investment intent (e.g., "actively investing", "exploring")
- `tech_stack`: Technologies mentioned (e.g., "AI/ML", "Blockchain")
- `industry`: Industry verticals (e.g., "Enterprise Software", "Consumer")

**Properties**:
- `value`: Extracted text value
- `confidence`: Extraction confidence (0-1)
- `context_snippet`: Surrounding transcript text

### 2. Contact Metadata

**Source**: `contacts` table

**Fields**:
- Basic info: name, email, company, title, location
- Contact types: LP, GP, Angel, FamilyOffice, Startup, Other
- Investor flags: `is_investor`, `is_family_office`
- Check sizes: `check_size_min`, `check_size_max`
- Investor notes: free-text description

### 3. Investment Thesis

**Source**: `theses` table (linked to contacts)

**Fields**:
- `sectors`: Array of sectors
- `stages`: Array of stages
- `check_sizes`: Array of check size ranges
- `geos`: Array of geographic preferences
- `personas`: Array of persona types
- `intents`: Array of investment intents
- `notes`: Free-text thesis description

### 4. Relationship Data

**Source**: `relationship_scores` and `relationship_events` tables

**Fields**:
- `current_score`: Relationship strength (0-1)
- `interaction_count`: Number of interactions
- `last_interaction_at`: Timestamp of last interaction
- `interaction_types`: Array of event types (meeting, email, intro, etc.)

### 5. Conversation Context

**Source**: `conversations` and `conversation_segments` tables

**Fields**:
- Recent transcript segments (last 5-10 minutes)
- Participants mentioned
- Conversation title/description
- Calendar event context (if linked)

## Feature Engineering

### 1. Semantic Features (Embeddings)

**Conversation Embedding**:
- Combine all entity values into single text: `"B2B SaaS pre-seed $1M SF Bay Area AI/ML"`
- Generate embedding using Vertex AI `text-embedding-004` (768 dimensions)
- Store in `conversation_embeddings` collection

**Contact Embedding**:
- Combine contact metadata + thesis into text: `"John Doe B2B SaaS seed $1M-$5M SF Bay Area GP actively investing"`
- Generate embedding (768 dimensions)
- Store in `contact_embeddings` collection
- Update when contact/thesis changes

**Similarity Score**:
- Cosine similarity between conversation and contact embeddings
- Range: 0-1 (1 = identical, 0 = unrelated)
- Formula: `cosine_similarity(conv_embedding, contact_embedding)`

### 2. Rule-Based Features

**Stage Match Score** (0-1):
```python
if exact_match(stage):
    score = 0.4
elif adjacent_stage(stage):  # pre-seed ↔ seed
    score = 0.2
elif range_overlap(stage):
    score = 0.1
else:
    score = 0.0
```

**Sector Match Score** (0-1):
```python
if exact_match(sector):
    score = 0.3
elif related_sector(sector):  # AI ↔ ML
    score = 0.15
else:
    score = 0.0
```

**Geo Match Score** (0-1):
```python
if exact_match(geo):
    score = 0.2
elif same_region(geo):  # SF ↔ Bay Area
    score = 0.1
else:
    score = 0.0
```

**Check Size Match Score** (0-1):
```python
if range_overlap(check_size):
    score = 0.2
elif adjacent_range(check_size):
    score = 0.1
else:
    score = 0.0
```

**Combined Rule Score**:
```python
rule_score = (
    stage_score * 0.3 +
    sector_score * 0.3 +
    geo_score * 0.2 +
    check_size_score * 0.2
)
```

### 3. Categorical Features (One-Hot Encoded)

**Contact Type Features**:
- `is_lp`: 1 if contact type includes "LP", else 0
- `is_gp`: 1 if contact type includes "GP", else 0
- `is_angel`: 1 if contact type includes "Angel", else 0
- `is_family_office`: 1 if `is_family_office` is true, else 0

**Entity Type Presence**:
- `has_sector_match`: 1 if any sector matches, else 0
- `has_stage_match`: 1 if any stage matches, else 0
- `has_geo_match`: 1 if any geo matches, else 0
- `has_check_size_match`: 1 if check size overlaps, else 0

### 4. Temporal Features

**Relationship Recency**:
- `days_since_last_interaction`: Number of days since last interaction
- Normalized: `1 / (1 + days_since_last_interaction / 365)` (0-1)

**Interaction Frequency**:
- `interactions_per_month`: Average interactions per month
- Normalized: `min(interactions_per_month / 10, 1.0)` (capped at 1.0)

### 5. Composite Features

**Relationship Boost**:
```python
relationship_boost = (
    current_score * 0.5 +
    interaction_frequency * 0.3 +
    recency_score * 0.2
)
# Range: 0-1, then scaled to 1.0-1.5 for final scoring
```

**Entity Coverage**:
```python
entity_coverage = (
    len(matched_entity_types) / len(total_entity_types)
)
# Range: 0-1, measures how many entity types matched
```

**Thesis Completeness**:
```python
thesis_completeness = (
    len(thesis.sectors) + len(thesis.stages) + len(thesis.geos)
) / 10  # Normalized by expected max
# Range: 0-1, measures how detailed the thesis is
```

## ML Model Features

### Input Vector (for training)

**Total dimensions**: ~50-100 (depending on categorical encoding)

**Feature groups**:
1. **Embedding similarities** (1 feature): Cosine similarity
2. **Rule-based scores** (5 features): Stage, sector, geo, check size, combined
3. **Categorical features** (10-20 features): One-hot encoded contact types, entity matches
4. **Temporal features** (3 features): Recency, frequency, relationship boost
5. **Composite features** (3 features): Entity coverage, thesis completeness, relationship boost

**Normalization**:
- All features normalized to 0-1 range
- Missing values imputed with 0 or median

### Target Variable

**Label**: `actual_score` (0-3)
- `0`: No match (contact not recommended)
- `1`: Weak match (1 star)
- `2`: Medium match (2 stars)
- `3`: Strong match (3 stars)

**Training data**:
- Positive examples: Historical `match_suggestions` with score >= 1
- Negative examples: Contacts not matched (or explicitly dismissed)

## Feature Importance (Expected)

Based on domain knowledge:

1. **Semantic similarity** (40%): Most important - captures nuanced matches
2. **Rule-based scores** (30%): Explicit criteria matching
3. **Relationship boost** (20%): Existing relationships matter
4. **Temporal features** (10%): Recent interactions boost relevance

## Feature Store

**Firestore Collections**:
- `contact_embeddings/{contactId}`: Pre-computed embeddings
- `conversation_embeddings/{conversationId}`: Real-time embeddings
- `feature_cache/{userId}/{conversationId}`: Cached feature vectors

**BigQuery Tables**:
- `matching_training_data`: Raw signals + labels
- `matching_features`: Engineered features for ML training

## Feature Updates

**Contact embeddings**: Updated when:
- Contact metadata changes
- Thesis is updated
- New relationship events occur

**Conversation embeddings**: Generated on-demand (real-time)

**Cache invalidation**: 
- Contact embeddings: Version-based (increment on update)
- Conversation embeddings: TTL-based (expire after 1 hour)

