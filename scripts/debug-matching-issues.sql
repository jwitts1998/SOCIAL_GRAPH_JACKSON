-- Debug Matching Issues
-- Run these queries to diagnose why matches aren't appearing

-- ============================================================================
-- 1. CHECK IF ENTITIES WERE EXTRACTED
-- ============================================================================

-- Replace 'YOUR_CONVERSATION_ID' with your actual conversation ID
-- Get conversation ID from the URL: /conversation/{id}

SELECT 
  ce.id,
  ce.entity_type,
  ce.value,
  ce.confidence,
  ce.context_snippet,
  ce.created_at
FROM conversation_entities ce
WHERE ce.conversation_id = 'YOUR_CONVERSATION_ID'  -- REPLACE THIS
ORDER BY ce.created_at DESC;

-- Count entities by type
SELECT 
  entity_type,
  COUNT(*) as count,
  STRING_AGG(value, ', ' ORDER BY value) as values
FROM conversation_entities
WHERE conversation_id = 'YOUR_CONVERSATION_ID'  -- REPLACE THIS
GROUP BY entity_type
ORDER BY count DESC;

-- ============================================================================
-- 2. CHECK YOUR CONTACTS
-- ============================================================================

-- Total contacts you own
SELECT COUNT(*) as total_contacts
FROM contacts
WHERE owned_by_profile = auth.uid();

-- Contacts with theses (these can be matched by AI)
SELECT 
  c.id,
  c.name,
  c.company,
  c.is_investor,
  COUNT(t.id) as thesis_count
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
GROUP BY c.id, c.name, c.company, c.is_investor
HAVING COUNT(t.id) > 0
ORDER BY c.name
LIMIT 20;

-- Contacts WITHOUT theses (only name matching works)
SELECT 
  c.id,
  c.name,
  c.company,
  c.is_investor
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
  AND t.id IS NULL
ORDER BY c.name
LIMIT 20;

-- ============================================================================
-- 3. CHECK THESES DATA
-- ============================================================================

-- View theses for your contacts
SELECT 
  c.name as contact_name,
  c.company,
  t.sectors,
  t.stages,
  t.check_sizes,
  t.geos,
  t.personas,
  t.intents,
  t.notes
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
ORDER BY c.name
LIMIT 20;

-- Count contacts by sector (from theses)
SELECT 
  UNNEST(t.sectors) as sector,
  COUNT(DISTINCT c.id) as contact_count,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) as contact_names
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
  AND t.sectors IS NOT NULL
  AND ARRAY_LENGTH(t.sectors, 1) > 0
GROUP BY UNNEST(t.sectors)
ORDER BY contact_count DESC;

-- Count contacts by stage (from theses)
SELECT 
  UNNEST(t.stages) as stage,
  COUNT(DISTINCT c.id) as contact_count,
  STRING_AGG(DISTINCT c.name, ', ' ORDER BY c.name) as contact_names
FROM contacts c
INNER JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
  AND t.stages IS NOT NULL
  AND ARRAY_LENGTH(t.stages, 1) > 0
GROUP BY UNNEST(t.stages)
ORDER BY contact_count DESC;

-- ============================================================================
-- 4. CHECK MATCHES THAT WERE GENERATED
-- ============================================================================

-- View all matches for a conversation
SELECT 
  ms.id,
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
WHERE ms.conversation_id = 'YOUR_CONVERSATION_ID'  -- REPLACE THIS
ORDER BY ms.score DESC, ms.created_at DESC;

-- Count matches by score
SELECT 
  score,
  COUNT(*) as count
FROM match_suggestions
WHERE conversation_id = 'YOUR_CONVERSATION_ID'  -- REPLACE THIS
GROUP BY score
ORDER BY score DESC;

-- ============================================================================
-- 5. CHECK IF CONTACTS ARE IN FIRST 100 (for AI matching)
-- ============================================================================

-- This shows the order contacts would be processed (first 100 get AI matching)
SELECT 
  ROW_NUMBER() OVER (ORDER BY c.created_at) as processing_order,
  c.id,
  c.name,
  c.company,
  c.is_investor,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) <= 100 
    THEN '✅ Will be AI matched'
    ELSE '❌ Will be skipped (beyond 100 limit)'
  END as ai_matching_status
FROM contacts c
WHERE c.owned_by_profile = auth.uid()
ORDER BY c.created_at
LIMIT 150;  -- Show first 150 to see which ones are cut off

-- ============================================================================
-- 6. CHECK FOR NAME MATCHES
-- ============================================================================

-- Check if any person_name entities match your contact names
SELECT 
  ce.value as mentioned_name,
  c.name as contact_name,
  c.id as contact_id,
  CASE 
    WHEN LOWER(c.name) LIKE '%' || LOWER(ce.value) || '%' 
      OR LOWER(ce.value) LIKE '%' || LOWER(c.name) || '%'
    THEN '✅ Potential name match'
    ELSE '❌ No match'
  END as match_status
FROM conversation_entities ce
CROSS JOIN contacts c
WHERE ce.conversation_id = 'YOUR_CONVERSATION_ID'  -- REPLACE THIS
  AND ce.entity_type = 'person_name'
  AND c.owned_by_profile = auth.uid()
  AND (
    LOWER(c.name) LIKE '%' || LOWER(ce.value) || '%' 
    OR LOWER(ce.value) LIKE '%' || LOWER(c.name) || '%'
  );

-- ============================================================================
-- 7. COMPREHENSIVE DIAGNOSIS
-- ============================================================================

-- Run this to get a full picture of why matches might not be appearing
WITH conversation_data AS (
  SELECT 'YOUR_CONVERSATION_ID'::uuid as conv_id  -- REPLACE THIS
),
entity_summary AS (
  SELECT 
    entity_type,
    COUNT(*) as count,
    STRING_AGG(value, ', ' ORDER BY value) as values
  FROM conversation_entities ce, conversation_data cd
  WHERE ce.conversation_id = cd.conv_id
  GROUP BY entity_type
),
contact_summary AS (
  SELECT 
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_investor THEN 1 END) as investor_contacts,
    COUNT(DISTINCT t.contact_id) as contacts_with_theses
  FROM contacts c
  LEFT JOIN theses t ON t.contact_id = c.id
  WHERE c.owned_by_profile = auth.uid()
),
match_summary AS (
  SELECT 
    COUNT(*) as total_matches,
    COUNT(CASE WHEN score = 3 THEN 1 END) as three_star_matches,
    COUNT(CASE WHEN score = 2 THEN 1 END) as two_star_matches,
    COUNT(CASE WHEN score = 1 THEN 1 END) as one_star_matches
  FROM match_suggestions ms, conversation_data cd
  WHERE ms.conversation_id = cd.conv_id
)
SELECT 
  'Entities Extracted' as check_type,
  COALESCE((SELECT COUNT(*) FROM conversation_entities ce, conversation_data cd WHERE ce.conversation_id = cd.conv_id), 0)::text as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM conversation_entities ce, conversation_data cd WHERE ce.conversation_id = cd.conv_id) = 0 
    THEN '❌ No entities extracted - entity extraction may have failed'
    ELSE '✅ Entities found'
  END as status
UNION ALL
SELECT 
  'Total Contacts' as check_type,
  cs.total_contacts::text as result,
  CASE 
    WHEN cs.total_contacts = 0 THEN '❌ No contacts found'
    ELSE '✅ Contacts exist'
  END as status
FROM contact_summary cs
UNION ALL
SELECT 
  'Investor Contacts' as check_type,
  cs.investor_contacts::text as result,
  CASE 
    WHEN cs.investor_contacts = 0 THEN '⚠️ No investor contacts (only name matching will work)'
    ELSE '✅ Investor contacts found'
  END as status
FROM contact_summary cs
UNION ALL
SELECT 
  'Contacts with Theses' as check_type,
  cs.contacts_with_theses::text as result,
  CASE 
    WHEN cs.contacts_with_theses = 0 THEN '❌ No contacts have theses (AI matching won''t work)'
    ELSE '✅ Contacts with theses found'
  END as status
FROM contact_summary cs
UNION ALL
SELECT 
  'Matches Generated' as check_type,
  ms.total_matches::text as result,
  CASE 
    WHEN ms.total_matches = 0 THEN '❌ No matches generated'
    ELSE '✅ Matches found'
  END as status
FROM match_summary ms;

