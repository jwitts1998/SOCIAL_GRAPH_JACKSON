#!/bin/bash

# Batch Generate Embeddings for Contacts
# This script calls the embed-contacts Edge Function in batch mode
# to generate embeddings for all contacts that don't have them yet.

set -e

echo "🚀 Starting batch embedding generation..."
echo ""

# Check if we have the required environment variables
if [ -z "$VITE_SUPABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: Missing SUPABASE_URL environment variable"
  echo "   Set it in .env or export it before running this script"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] && [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Missing SUPABASE_ANON_KEY environment variable"
  echo "   Set it in .env or export it before running this script"
  exit 1
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}"

# Load .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}"
  SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}"
fi

echo "📊 Checking contacts that need embeddings..."
echo ""

TOTAL_PROCESSED=0
BATCH_NUMBER=1
HAS_MORE=true

while [ "$HAS_MORE" = "true" ]; do
  echo "📦 Processing batch $BATCH_NUMBER..."

  # Call the Edge Function
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/embed-contacts" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_KEY}" \
    -d '{"mode": "batch"}')

  # Parse response (basic JSON parsing with jq if available, otherwise use grep)
  if command -v jq &> /dev/null; then
    PROCESSED=$(echo "$RESPONSE" | jq -r '.processed // 0')
    TOTAL=$(echo "$RESPONSE" | jq -r '.total // 0')
    HAS_MORE=$(echo "$RESPONSE" | jq -r '.hasMore // false')
    ERRORS=$(echo "$RESPONSE" | jq -r '.errors // [] | length')
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message // ""')
  else
    # Fallback: basic parsing without jq
    PROCESSED=$(echo "$RESPONSE" | grep -o '"processed":[0-9]*' | grep -o '[0-9]*' || echo "0")
    TOTAL=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' || echo "0")
    HAS_MORE=$(echo "$RESPONSE" | grep -q '"hasMore":true' && echo "true" || echo "false")
    ERRORS=0
    MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || echo "")
  fi

  if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
    echo "   ℹ️  $MESSAGE"
  fi

  if [ "$PROCESSED" -gt 0 ]; then
    TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
    echo "   ✅ Processed $PROCESSED/$TOTAL contacts in this batch"
    
    if [ "$ERRORS" -gt 0 ]; then
      echo "   ⚠️  $ERRORS errors occurred (check Supabase logs for details)"
    fi
  fi

  if [ "$HAS_MORE" = "true" ]; then
    echo "   ⏳ $TOTAL_PROCESSED total processed so far, continuing..."
    echo ""
    sleep 1  # Wait between batches
    BATCH_NUMBER=$((BATCH_NUMBER + 1))
  else
    echo ""
    echo "✅ Complete! Processed $TOTAL_PROCESSED contacts total."
    HAS_MORE="false"
  fi
done

echo ""
echo "🎉 Done! All contacts with available data now have embeddings."
echo ""
echo "💡 Note: Contacts without 'bio' or 'investor_notes' won't have embeddings."
echo "   This is expected - they'll still be matched via GPT scoring."

