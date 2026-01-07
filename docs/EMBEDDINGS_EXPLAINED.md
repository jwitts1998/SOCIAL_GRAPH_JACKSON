# Embeddings Explained - A Practical Guide

**Last Updated**: 2025-01-31  
**Purpose**: Understand what embeddings are and how they work for contact matching

---

## What Are Embeddings? (Simple Explanation)

**Embeddings are numerical representations of text that capture meaning.**

Think of it like this:
- **Text**: "B2B SaaS startup"
- **Embedding**: `[0.12, -0.45, 0.78, 0.91, ..., 0.23]` (1536 numbers)

The key insight: **Similar meanings = similar numbers**

---

## Real-World Analogy

Imagine you're organizing books in a library:

**Traditional Approach** (Keyword Matching):
- "AI healthcare" book → Search for "AI" OR "healthcare"
- Problem: Misses "machine learning medical" (different words, same meaning)

**Embedding Approach** (Semantic Understanding):
- "AI healthcare" book → Position in "AI/ML + Healthcare" section
- "Machine learning medical" book → Same section (similar meaning!)
- **Result**: Books with similar meanings are grouped together

**Embeddings do the same thing for text** - they position text in a "meaning space" where similar meanings are close together.

---

## How Embeddings Work

### Step 1: Text Input

```
Input: "B2B SaaS startup at pre-seed stage"
```

### Step 2: Model Processing

The embedding model (like `text-embedding-3-small`) reads the text and converts it to numbers:

```
Output: [0.12, -0.45, 0.78, 0.91, -0.23, 0.56, ..., 0.34]
         ↑     ↑     ↑     ↑     ↑      ↑            ↑
        1536 numbers total (each between -1 and 1)
```

### Step 3: What Do These Numbers Mean?

Each number represents a **dimension of meaning**:

- Dimension 1 (0.12): "Business-to-business" concept
- Dimension 2 (-0.45): "Software" concept  
- Dimension 3 (0.78): "Early stage" concept
- Dimension 4 (0.91): "Technology" concept
- ... (1532 more dimensions)

**The model learned these dimensions from training on billions of text examples.**

---

## Why Embeddings Are Powerful

### Example 1: Synonym Understanding

**Traditional Keyword Matching**:
```
"B2B SaaS" → Matches: "B2B SaaS" ✅
"B2B SaaS" → Matches: "enterprise software" ❌ (different words)
```

**Embedding Matching**:
```
"B2B SaaS" embedding: [0.12, -0.45, 0.78, ...]
"enterprise software" embedding: [0.15, -0.42, 0.81, ...]
Similarity: 0.89 (very similar!)
```

**Result**: Embeddings understand that "B2B SaaS" and "enterprise software" are similar concepts.

### Example 2: Context Understanding

**Traditional Approach**:
```
"AI healthcare" → Matches: "AI" OR "healthcare"
Problem: Also matches "AI fintech" (wrong!)
```

**Embedding Approach**:
```
"AI healthcare" embedding: [0.12, 0.89, -0.23, ...]
"AI fintech" embedding: [0.15, -0.45, 0.78, ...]
Similarity: 0.45 (different enough to distinguish)
```

**Result**: Embeddings understand the combination of concepts, not just individual words.

### Example 3: Variation Handling

**Traditional Approach**:
```
"pre-seed" → Matches: "pre-seed" ✅
"pre seed" → Matches: "pre-seed" ❌ (different spelling)
```

**Embedding Approach**:
```
"pre-seed" embedding: [0.78, 0.12, ...]
"pre seed" embedding: [0.79, 0.11, ...]
Similarity: 0.98 (almost identical!)
```

**Result**: Embeddings handle spelling variations, punctuation, etc.

---

## Visual Representation

Imagine a 2D map of meaning (embeddings are actually 1536-dimensional, but we'll simplify):

```
                    Healthcare
                        ↑
                        |
        Fintech ←-------+----→ B2B SaaS
                        |
                        ↓
                    Consumer
```

**In embedding space**:
- "AI healthcare" and "healthtech" are close together
- "B2B SaaS" and "enterprise software" are close together
- "pre-seed" and "seed" are close together
- "AI healthcare" and "AI fintech" are further apart (different sectors)

**When you calculate similarity, you're measuring distance in this meaning space.**

---

## How Similarity Works

### Cosine Similarity (The Math)

```typescript
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Step 1: Calculate dot product (multiply corresponding numbers, sum them)
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  
  // Step 2: Calculate magnitude (length) of each vector
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  // Step 3: Divide dot product by product of magnitudes
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### What the Result Means

**Cosine Similarity returns a value between -1 and 1:**

- **1.0**: Identical meaning
- **0.8-0.9**: Very similar (e.g., "B2B SaaS" vs "enterprise software")
- **0.6-0.7**: Somewhat similar (e.g., "fintech" vs "B2B SaaS")
- **0.3-0.5**: Different but related (e.g., "AI" vs "healthcare")
- **0.0**: Unrelated
- **-1.0**: Opposite meaning

### Real Example

```typescript
const embedding1 = getEmbedding("B2B SaaS startup");
const embedding2 = getEmbedding("enterprise software company");

const similarity = cosineSimilarity(embedding1, embedding2);
// Result: 0.87 (very similar!)

const embedding3 = getEmbedding("consumer fintech app");
const similarity2 = cosineSimilarity(embedding1, embedding3);
// Result: 0.52 (somewhat related, but different)
```

---

## Embeddings in Your System

### What You Already Have

1. **Contact Bio Embeddings** (`bio_embedding`)
   - Generated from: `bio + title + investor_notes + company`
   - Stored in: `contacts.bio_embedding` (JSON array)
   - Example: "John is a GP at XYZ Ventures, focuses on B2B SaaS at seed stage"

2. **Contact Thesis Embeddings** (`thesis_embedding`)
   - Generated from: `sectors + stages + geos + check_sizes`
   - Stored in: `contacts.thesis_embedding` (JSON array)
   - Example: "B2B SaaS, fintech | pre-seed, seed | SF Bay Area | $500K-$2M"

3. **Conversation Entity Embeddings** (`entity_embedding`)
   - Generated from: All conversation entities combined
   - Stored in: `conversations.entity_embedding` (JSON array)
   - Example: "B2B SaaS . pre-seed . $1M . San Francisco . GP"

### How They're Generated

**Function**: `embed-contacts` or `embed-conversation-entities`

**Process**:
```typescript
// 1. Combine text fields
const textToEmbed = [
  contact.bio,
  contact.title,
  contact.investor_notes,
  contact.company
].filter(Boolean).join(' ');

// 2. Call OpenAI Embeddings API
const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: textToEmbed,
  }),
});

// 3. Get embedding vector
const embedding = response.data[0].embedding;
// Result: [0.12, -0.45, 0.78, ..., 0.23] (1536 numbers)

// 4. Store in database (as JSON string)
await updateContact({
  bio_embedding: JSON.stringify(embedding)
});
```

**Model Used**: `text-embedding-3-small`
- **Dimensions**: 1536 numbers
- **Cost**: $0.02 per 1 million tokens
- **Speed**: Very fast (~100ms per embedding)

---

## Practical Example: Finding Similar Contacts

### Scenario

**Conversation Entities**: "B2B SaaS startup at pre-seed stage, looking for $1M"

**Your Contacts**:
1. Contact A: "GP at XYZ Ventures, invests in B2B SaaS at seed stage"
2. Contact B: "Angel investor, focuses on enterprise software, pre-seed to seed"
3. Contact C: "LP interested in fintech and healthcare"

### Step 1: Generate Conversation Embedding

```typescript
const conversationText = "B2B SaaS . pre-seed . $1M";
const convEmbedding = await generateEmbedding(conversationText);
// Result: [0.12, -0.45, 0.78, 0.91, ..., 0.23]
```

### Step 2: Compare Against Contact Embeddings

```typescript
// Contact A embedding (from database)
const contactAEmbedding = JSON.parse(contactA.bio_embedding);
const similarityA = cosineSimilarity(convEmbedding, contactAEmbedding);
// Result: 0.87 (very similar!)

// Contact B embedding
const contactBEmbedding = JSON.parse(contactB.bio_embedding);
const similarityB = cosineSimilarity(convEmbedding, contactBEmbedding);
// Result: 0.82 (very similar!)

// Contact C embedding
const contactCEmbedding = JSON.parse(contactC.bio_embedding);
const similarityC = cosineSimilarity(convEmbedding, contactCEmbedding);
// Result: 0.35 (not very similar)
```

### Step 3: Rank by Similarity

```typescript
const matches = [
  { contact: contactA, similarity: 0.87 },
  { contact: contactB, similarity: 0.82 },
  { contact: contactC, similarity: 0.35 },
].sort((a, b) => b.similarity - a.similarity);

// Top matches: Contact A (0.87), Contact B (0.82)
```

**Result**: Contact A and B are the best matches (high similarity scores)

---

## Why Embeddings Beat Keyword Matching

### Keyword Matching Problems

```typescript
// Problem 1: Misses synonyms
"B2B SaaS" → matches "B2B SaaS" ✅
"B2B SaaS" → doesn't match "enterprise software" ❌

// Problem 2: Too broad
"AI" → matches "AI healthcare" ✅
"AI" → matches "AI fintech" ✅ (but we wanted healthcare!)

// Problem 3: Misses context
"seed" → matches "seed stage" ✅
"seed" → matches "seed funding" ✅
"seed" → matches "plant seeds" ❌ (wrong context!)
```

### Embedding Matching Solutions

```typescript
// Solution 1: Handles synonyms
"B2B SaaS" embedding → similar to "enterprise software" embedding ✅

// Solution 2: Understands context
"AI healthcare" embedding → different from "AI fintech" embedding ✅

// Solution 3: Context-aware
"seed stage" embedding → different from "plant seeds" embedding ✅
```

---

## Embeddings vs. GPT: When to Use What

### Use Embeddings For:

✅ **Finding similar items** (semantic search)
- "Which contacts are similar to this conversation?"
- "Find contacts with similar investment focus"

✅ **Pre-filtering** (narrowing down candidates)
- "From 1000 contacts, find top 50 most similar"
- Fast, cheap, scales well

✅ **Caching** (embeddings don't change)
- Generate once, use many times
- No API calls during matching

### Use GPT For:

✅ **Complex reasoning** (understanding nuance)
- "Why is this a good match?" (explanation)
- "Score this match considering multiple factors"

✅ **Context understanding** (beyond similarity)
- "This contact matches on sector, but their thesis excludes this stage"
- "This is a good match, but they're currently not investing"

✅ **Explainability** (human-readable reasons)
- "Matches because: B2B SaaS focus, seed stage, SF Bay Area"

### Best Practice: Use Both!

**Hybrid Approach**:
1. **Embeddings**: Find top 50 similar contacts (fast, cheap)
2. **GPT**: Score those 50 and explain why (intelligent, explainable)

**Result**: Fast + Intelligent + Explainable + Cost-effective

---

## Common Questions

### Q: How accurate are embeddings?

**A**: Very accurate for semantic similarity. They understand:
- Synonyms ("B2B SaaS" = "enterprise software")
- Context ("AI healthcare" ≠ "AI fintech")
- Variations ("pre-seed" = "pre seed")

**But**: They're not perfect. They may miss very specific domain knowledge that GPT would catch.

### Q: Do embeddings understand my domain (VC/investing)?

**A**: Yes, because:
- The model was trained on billions of web pages (including VC/investing content)
- It understands business terms, investment stages, sectors, etc.
- You can fine-tune if needed (advanced topic)

### Q: How do I know if two embeddings are similar?

**A**: Use cosine similarity:
- **> 0.8**: Very similar (likely a good match)
- **0.6-0.8**: Somewhat similar (possible match)
- **< 0.6**: Not very similar (probably not a match)

### Q: Can I update embeddings when data changes?

**A**: Yes! When a contact's bio or thesis changes:
1. Regenerate embedding (call `embed-contacts`)
2. Update database
3. New matching will use updated embedding

### Q: How much do embeddings cost?

**A**: Very cheap:
- **Generation**: $0.02 per 1 million tokens
- **1 contact** = ~500 tokens = **$0.00001** (one-time)
- **1000 contacts** = **$0.01** (one-time)
- **Matching**: $0 (just math, no API calls)

### Q: How fast are embeddings?

**A**: Very fast:
- **Generation**: ~100ms per embedding (API call)
- **Similarity calculation**: <1ms per comparison
- **1000 contacts**: <1 second total

---

## Next Steps: Hybrid Approach

Now that you understand embeddings, here's how we'll use them in the hybrid approach:

1. **Pre-filtering**: Use embeddings to find top 50 similar contacts
2. **GPT Scoring**: Send only those 50 to GPT for final scoring
3. **Combine**: Weight embedding similarity + GPT score

**Benefits**:
- 50% cost reduction (50 contacts vs 100)
- Removes 100 contact limit
- Maintains GPT quality
- Fast and scalable

Ready to move to the hybrid approach implementation?

