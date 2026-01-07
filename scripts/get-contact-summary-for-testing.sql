-- Get Contact Summary for Test Script Generation
-- Run this to see what contacts you have and their investment focus
-- Use this to create personalized test scripts

SELECT 
  c.name,
  c.company,
  c.title,
  c.location,
  c.contact_type,
  ARRAY_TO_STRING(t.sectors, ', ') as sectors,
  ARRAY_TO_STRING(t.stages, ', ') as stages,
  ARRAY_TO_STRING(t.check_sizes, ', ') as check_sizes,
  ARRAY_TO_STRING(t.geos, ', ') as geos,
  ARRAY_TO_STRING(t.personas, ', ') as personas,
  t.notes as thesis_notes,
  c.investor_notes,
  -- Build a test script snippet for this contact
  CONCAT(
    'Test: Mention a ',
    COALESCE(t.sectors[1], 'B2B SaaS'),
    ' startup at ',
    COALESCE(t.stages[1], 'pre-seed'),
    ' stage. ',
    CASE 
      WHEN c.name IS NOT NULL 
      THEN CONCAT('Say: "I think ', c.name, ' would be a great match."')
      ELSE ''
    END
  ) as test_snippet
FROM contacts c
LEFT JOIN theses t ON t.contact_id = c.id
WHERE c.owned_by_profile = auth.uid()
  AND c.is_investor = true
ORDER BY c.name
LIMIT 20;

-- Get contacts by sector (for sector-specific test scripts)
SELECT 
  sector,
  COUNT(*) as contact_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as contact_names
FROM (
  SELECT 
    c.id,
    c.name,
    UNNEST(t.sectors) as sector
  FROM contacts c
  INNER JOIN theses t ON t.contact_id = c.id
  WHERE c.owned_by_profile = auth.uid()
    AND t.sectors IS NOT NULL
    AND ARRAY_LENGTH(t.sectors, 1) > 0
) sub
GROUP BY sector
ORDER BY contact_count DESC;

-- Get contacts by stage (for stage-specific test scripts)
SELECT 
  stage,
  COUNT(*) as contact_count,
  STRING_AGG(c.name, ', ' ORDER BY c.name) as contact_names
FROM (
  SELECT 
    c.id,
    c.name,
    UNNEST(t.stages) as stage
  FROM contacts c
  INNER JOIN theses t ON t.contact_id = c.id
  WHERE c.owned_by_profile = auth.uid()
    AND t.stages IS NOT NULL
    AND ARRAY_LENGTH(t.stages, 1) > 0
) sub
GROUP BY stage
ORDER BY contact_count DESC;

