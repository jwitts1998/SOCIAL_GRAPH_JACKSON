-- Quick Test for Hybrid Matching
-- Run these queries in Supabase SQL Editor to verify the implementation

-- ============================================================================
-- PRE-TEST: Verify Prerequisites
-- ============================================================================

-- 1. Check if conversation has entities
SELECT 
  COUNT(*) as entity_count,
  STRING_AGG(DISTINCT entity_type, ', ') as entity_types
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- 2. Check if conversation has embedding (may be null - will be generated)
SELECT 
  id,
  entity_embedding IS NOT NULL as has_embedding,
  CASE 
    WHEN entity_embedding IS NOT NULL THEN '✅ Cached'
    ELSE '⚠️ Will be generated'
  END as embedding_status
FROM conversations
WHERE id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- 3. Check contacts with embeddings
-- NOTE: Run migration 20250201000002_add_contact_embeddings.sql first if columns don't exist
SELECT 
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN bio_embedding IS NOT NULL THEN 1 END) as with_bio_embedding,
  COUNT(CASE WHEN thesis_embedding IS NOT NULL THEN 1 END) as with_thesis_embedding,
  COUNT(CASE WHEN bio_embedding IS NOT NULL OR thesis_embedding IS NOT NULL THEN 1 END) as with_any_embedding
FROM contacts
WHERE owned_by_profile = auth.uid();

-- ============================================================================
-- POST-TEST: Verify Results
-- ============================================================================

-- 4. Check matches with similarity scores
SELECT 
  ms.score,
  ms.semantic_similarity,
  ms.reasons,
  ms.justification,
  c.name as contact_name,
  c.company,
  CASE 
    WHEN ms.semantic_similarity IS NULL THEN 'No embedding'
    WHEN ms.semantic_similarity >= 0.8 THEN '✅ Very similar'
    WHEN ms.semantic_similarity >= 0.6 THEN '✅ Similar'
    WHEN ms.semantic_similarity >= 0.4 THEN '⚠️ Somewhat similar'
    ELSE '❌ Not very similar'
  END as similarity_rating
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY ms.score DESC, ms.semantic_similarity DESC NULLS LAST
LIMIT 20;

-- 5. Summary statistics
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN semantic_similarity IS NOT NULL THEN 1 END) as matches_with_similarity,
  AVG(semantic_similarity) as avg_similarity,
  MAX(semantic_similarity) as max_similarity,
  MIN(semantic_similarity) as min_similarity,
  COUNT(CASE WHEN score = 3 THEN 1 END) as three_star_matches,
  COUNT(CASE WHEN score = 2 THEN 1 END) as two_star_matches,
  COUNT(CASE WHEN score = 1 THEN 1 END) as one_star_matches
FROM match_suggestions
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- 6. Check if Matthew Cook matched (name matching test)
SELECT 
  ms.score,
  ms.semantic_similarity,
  ms.reasons,
  c.name,
  CASE 
    WHEN ms.reasons::text LIKE '%name%' OR ms.reasons::text LIKE '%Mentioned%' THEN '✅ Name match'
    ELSE 'GPT match'
  END as match_type
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND (LOWER(c.name) LIKE '%matthew%' AND LOWER(c.name) LIKE '%cook%');

