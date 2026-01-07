#!/bin/bash

# Test Script for Hybrid Matching Implementation
# Tests the new embeddings pre-filtering + GPT scoring approach

set -e

echo "🧪 Testing Hybrid Matching Implementation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if conversation ID is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: ./scripts/test-hybrid-matching.sh <conversation-id>${NC}"
  echo ""
  echo "Example: ./scripts/test-hybrid-matching.sh b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4"
  echo ""
  echo "Or run without arguments to see test checklist:"
  echo ""
  echo "Test Checklist:"
  echo "1. ✅ Verify conversation has entities extracted"
  echo "2. ✅ Verify conversation has entity_embedding (or will be generated)"
  echo "3. ✅ Verify contacts have bio_embedding or thesis_embedding"
  echo "4. ✅ Process conversation via UI or API"
  echo "5. ✅ Check Edge Function logs for:"
  echo "   - '✅ Using cached conversation embedding' OR '✅ Generated conversation embedding'"
  echo "   - '🔍 Starting semantic pre-filtering with embeddings...'"
  echo "   - '📊 Calculated similarity for X contacts with embeddings'"
  echo "   - '📈 Top 5 similarities: ...'"
  echo "   - '✅ Pre-filtered to X contacts'"
  echo "   - '🎯 Processing X pre-filtered contacts for GPT scoring'"
  echo "6. ✅ Verify matches are created with semantic_similarity field"
  echo "7. ✅ Verify top matches have high similarity scores (>0.7)"
  exit 0
fi

CONVERSATION_ID=$1

echo "📋 Conversation ID: $CONVERSATION_ID"
echo ""

# SQL queries to run in Supabase SQL Editor
echo "🔍 Step 1: Check if conversation has entities"
echo "Run this SQL in Supabase SQL Editor:"
echo ""
echo "SELECT COUNT(*) as entity_count FROM conversation_entities WHERE conversation_id = '$CONVERSATION_ID';"
echo ""

echo "🔍 Step 2: Check if conversation has embedding"
echo "Run this SQL:"
echo ""
echo "SELECT entity_embedding IS NOT NULL as has_embedding FROM conversations WHERE id = '$CONVERSATION_ID';"
echo ""

echo "🔍 Step 3: Check contacts with embeddings"
echo "⚠️  IMPORTANT: Run migration first if columns don't exist:"
echo "   supabase/migrations/20250201000002_add_contact_embeddings.sql"
echo ""
echo "Run this SQL:"
echo ""
echo "SELECT COUNT(*) as contacts_with_embeddings FROM contacts WHERE owned_by_profile = auth.uid() AND (bio_embedding IS NOT NULL OR thesis_embedding IS NOT NULL);"
echo ""

echo "🔍 Step 4: Process conversation"
echo "Go to: /conversation/$CONVERSATION_ID"
echo "Click: 'Process Conversation' button"
echo ""

echo "🔍 Step 5: Check matches with similarity scores"
echo "Run this SQL:"
echo ""
echo "SELECT ms.score, ms.semantic_similarity, ms.reasons, c.name FROM match_suggestions ms JOIN contacts c ON c.id = ms.contact_id WHERE ms.conversation_id = '$CONVERSATION_ID' ORDER BY ms.score DESC, ms.semantic_similarity DESC NULLS LAST;"
echo ""

echo "✅ Test Complete!"
echo ""
echo "Expected Results:"
echo "- Matches should have semantic_similarity scores (0.0-1.0)"
echo "- Top matches should have similarity > 0.7"
echo "- Only 50 contacts should be sent to GPT (check logs)"
echo "- Cost should be ~50% lower than before"

