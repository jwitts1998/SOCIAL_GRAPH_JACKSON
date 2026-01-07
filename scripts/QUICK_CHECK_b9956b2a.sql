-- QUICK CHECK for Conversation: b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4
-- Run this in Supabase SQL Editor

-- ============================================================================
-- QUICK DIAGNOSIS
-- ============================================================================

-- 1. What entities were extracted? (You confirmed 18 exist)
SELECT 
  entity_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT value, ', ' ORDER BY value) as sample_values
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
GROUP BY entity_type
ORDER BY count DESC;

-- 2. Were matches generated?
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN score = 3 THEN 1 END) as three_star,
  COUNT(CASE WHEN score = 2 THEN 1 END) as two_star,
  COUNT(CASE WHEN score = 1 THEN 1 END) as one_star
FROM match_suggestions
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- 3. If matches exist, show them
SELECT 
  ms.score,
  ms.reasons,
  ms.justification,
  c.name as contact_name,
  c.company
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY ms.score DESC;

-- 4. Do you have contacts with theses? (Needed for AI matching)
SELECT 
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as contacts_with_theses
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid();

-- 5. Sample of your contacts with theses (first 100 - what gets sent to GPT)
SELECT 
  c.name,
  c.company,
  t.sectors,
  t.stages,
  t.check_sizes,
  t.geos
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
ORDER BY c.created_at
LIMIT 10;

