-- Quick Diagnostic for Conversation: b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CHECK ENTITIES (you already confirmed 18 exist)
-- ============================================================================

SELECT 
  entity_type,
  COUNT(*) as count,
  STRING_AGG(value, ', ' ORDER BY value) as values
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
GROUP BY entity_type
ORDER BY count DESC;

-- Detailed entity view
SELECT 
  entity_type,
  value,
  confidence,
  context_snippet
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY entity_type, value;

-- ============================================================================
-- 2. CHECK IF MATCHES WERE GENERATED
-- ============================================================================

-- Count matches
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN score = 3 THEN 1 END) as three_star_matches,
  COUNT(CASE WHEN score = 2 THEN 1 END) as two_star_matches,
  COUNT(CASE WHEN score = 1 THEN 1 END) as one_star_matches
FROM match_suggestions
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4';

-- View all matches
SELECT 
  ms.score,
  ms.reasons,
  ms.justification,
  ms.status,
  ms.created_at,
  c.name as contact_name,
  c.company,
  c.is_investor
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
ORDER BY ms.score DESC, ms.created_at DESC;

-- ============================================================================
-- 3. CHECK YOUR CONTACTS AND THESES
-- ============================================================================

-- Total contacts
SELECT COUNT(*) as total_contacts
FROM contacts
WHERE owned_by_profile = auth.uid();

-- Contacts with theses (these can be AI matched)
SELECT 
  c.id,
  c.name,
  c.company,
  c.is_investor,
  t.sectors,
  t.stages,
  t.check_sizes,
  t.geos
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
ORDER BY c.created_at
LIMIT 100;  -- First 100 contacts (what gets sent to GPT)

-- Count contacts with theses
SELECT COUNT(DISTINCT c.id) as contacts_with_theses
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid();

-- ============================================================================
-- 4. CHECK NAME MATCHES (if person_name entities exist)
-- ============================================================================

-- Check if any person_name entities match your contacts
SELECT 
  ce.value as mentioned_name,
  c.name as contact_name,
  c.id as contact_id,
  c.company
FROM conversation_entities ce
CROSS JOIN contacts c
WHERE ce.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND ce.entity_type = 'person_name'
  AND c.owned_by_profile = auth.uid()
  AND (
    LOWER(c.name) LIKE '%' || LOWER(ce.value) || '%' 
    OR LOWER(ce.value) LIKE '%' || LOWER(c.name) || '%'
  );

-- ============================================================================
-- 5. COMPREHENSIVE DIAGNOSIS
-- ============================================================================

SELECT 
  'Entities Extracted' as check_item,
  COUNT(*)::text as result,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Entities found'
    ELSE '❌ No entities'
  END as status
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
UNION ALL
SELECT 
  'Matches Generated' as check_item,
  COUNT(*)::text as result,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Matches found'
    ELSE '❌ No matches generated'
  END as status
FROM match_suggestions
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
UNION ALL
SELECT 
  'Total Contacts' as check_item,
  COUNT(*)::text as result,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Contacts exist'
    ELSE '❌ No contacts'
  END as status
FROM contacts
WHERE owned_by_profile = auth.uid()
UNION ALL
SELECT 
  'Contacts with Theses' as check_item,
  COUNT(DISTINCT c.id)::text as result,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 THEN '✅ Theses found'
    ELSE '❌ No theses (AI matching won''t work)'
  END as status
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid();

