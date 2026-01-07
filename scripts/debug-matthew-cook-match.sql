-- Debug: Why isn't Matthew Cook matching?
-- For conversation: b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4

-- ============================================================================
-- 1. CHECK IF "Matthew Cook" WAS EXTRACTED AS person_name ENTITY
-- ============================================================================

-- Check all person_name entities
SELECT 
  id,
  entity_type,
  value,
  confidence,
  context_snippet,
  created_at
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND entity_type = 'person_name'
ORDER BY created_at DESC;

-- Check if "Matthew Cook" (or variations) were extracted
SELECT 
  id,
  entity_type,
  value,
  confidence,
  context_snippet
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND (
    LOWER(value) LIKE '%matthew%' 
    OR LOWER(value) LIKE '%cook%'
    OR LOWER(value) LIKE '%matthew cook%'
  )
ORDER BY created_at DESC;

-- ============================================================================
-- 2. CHECK IF MATTHEW COOK CONTACT EXISTS
-- ============================================================================

-- Find Matthew Cook contact
SELECT 
  id,
  name,
  first_name,
  last_name,
  company,
  email,
  is_investor
FROM contacts
WHERE owned_by_profile = auth.uid()
  AND (
    LOWER(name) LIKE '%matthew%cook%'
    OR LOWER(name) LIKE '%cook%matthew%'
    OR (LOWER(first_name) LIKE '%matthew%' AND LOWER(last_name) LIKE '%cook%')
    OR (LOWER(first_name) LIKE '%cook%' AND LOWER(last_name) LIKE '%matthew%')
  );

-- Exact match check
SELECT 
  id,
  name,
  first_name,
  last_name,
  company
FROM contacts
WHERE owned_by_profile = auth.uid()
  AND (
    LOWER(name) = 'matthew cook'
    OR (LOWER(COALESCE(first_name, '')) = 'matthew' AND LOWER(COALESCE(last_name, '')) = 'cook')
  );

-- ============================================================================
-- 3. CHECK IF MATCH WAS GENERATED
-- ============================================================================

-- Check if Matthew Cook has a match for this conversation
SELECT 
  ms.id,
  ms.score,
  ms.reasons,
  ms.justification,
  ms.status,
  ms.created_at,
  c.name as contact_name,
  c.company
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND (
    LOWER(c.name) LIKE '%matthew%cook%'
    OR LOWER(c.name) LIKE '%cook%matthew%'
  )
ORDER BY ms.created_at DESC;

-- ============================================================================
-- 4. TEST NAME MATCHING LOGIC
-- ============================================================================

-- Simulate the name matching logic from generate-matches function
-- This checks if any person_name entities would match Matthew Cook contact
WITH person_names AS (
  SELECT DISTINCT LOWER(value) as mentioned_name
  FROM conversation_entities
  WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
    AND entity_type = 'person_name'
),
contacts_check AS (
  SELECT 
    c.id,
    c.name,
    c.first_name,
    c.last_name,
    LOWER(c.name) as name_lower,
    LOWER(COALESCE(c.first_name || ' ' || c.last_name, c.name)) as full_name_lower
  FROM contacts c
  WHERE c.owned_by_profile = auth.uid()
    AND (
      LOWER(c.name) LIKE '%matthew%'
      OR LOWER(c.name) LIKE '%cook%'
      OR LOWER(COALESCE(c.first_name, '')) LIKE '%matthew%'
      OR LOWER(COALESCE(c.last_name, '')) LIKE '%cook%'
    )
)
SELECT 
  pn.mentioned_name,
  cc.name as contact_name,
  cc.full_name_lower,
  CASE 
    WHEN cc.name_lower LIKE '%' || pn.mentioned_name || '%' 
      OR pn.mentioned_name LIKE '%' || cc.name_lower || '%'
    THEN '✅ Would match (contains)'
    ELSE '❌ Would not match'
  END as match_status
FROM person_names pn
CROSS JOIN contacts_check cc
WHERE (
  cc.name_lower LIKE '%' || pn.mentioned_name || '%' 
  OR pn.mentioned_name LIKE '%' || cc.name_lower || '%'
);

-- ============================================================================
-- 5. COMPREHENSIVE CHECK
-- ============================================================================

SELECT 
  'Person Names Extracted' as check_item,
  COUNT(*)::text as result,
  STRING_AGG(value, ', ') as details
FROM conversation_entities
WHERE conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND entity_type = 'person_name'
UNION ALL
SELECT 
  'Matthew Cook Contact Exists' as check_item,
  COUNT(*)::text as result,
  STRING_AGG(name, ', ') as details
FROM contacts
WHERE owned_by_profile = auth.uid()
  AND (
    LOWER(name) LIKE '%matthew%cook%'
    OR LOWER(name) LIKE '%cook%matthew%'
  )
UNION ALL
SELECT 
  'Matthew Cook Match Generated' as check_item,
  COUNT(*)::text as result,
  STRING_AGG(c.name, ', ') as details
FROM match_suggestions ms
JOIN contacts c ON c.id = ms.contact_id
WHERE ms.conversation_id = 'b9956b2a-bfd2-4378-af1f-8e0d0fa5c3d4'
  AND (
    LOWER(c.name) LIKE '%matthew%cook%'
    OR LOWER(c.name) LIKE '%cook%matthew%'
  );

