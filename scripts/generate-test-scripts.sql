-- Generate Personalized Test Scripts Based on Your Contacts
-- Run this in Supabase SQL Editor to get test scripts tailored to your contacts

-- This query generates test conversation scripts based on your actual contacts and their theses
-- Copy the output and use it as a test script for recording

WITH contact_theses AS (
  SELECT 
    c.id,
    c.name,
    c.company,
    c.title,
    c.location,
    t.sectors,
    t.stages,
    t.check_sizes,
    t.geos,
    t.personas,
    t.intents,
    -- Build a summary of the contact's investment focus
    CONCAT(
      COALESCE(c.name, ''),
      ' invests in ',
      COALESCE(ARRAY_TO_STRING(t.sectors, ', '), 'various sectors'),
      ' at ',
      COALESCE(ARRAY_TO_STRING(t.stages, ', '), 'various stages'),
      CASE 
        WHEN t.check_sizes IS NOT NULL AND ARRAY_LENGTH(t.check_sizes, 1) > 0 
        THEN CONCAT(' with check sizes of ', ARRAY_TO_STRING(t.check_sizes, ', '))
        ELSE ''
      END,
      CASE 
        WHEN t.geos IS NOT NULL AND ARRAY_LENGTH(t.geos, 1) > 0 
        THEN CONCAT(' in ', ARRAY_TO_STRING(t.geos, ', '))
        ELSE ''
      END
    ) as investment_focus
  FROM contacts c
  LEFT JOIN theses t ON t.contact_id = c.id
  WHERE c.owned_by_profile = auth.uid()
    AND t.sectors IS NOT NULL 
    AND ARRAY_LENGTH(t.sectors, 1) > 0
  ORDER BY RANDOM()
  LIMIT 5
)
SELECT 
  'Test Script for: ' || name as script_title,
  CONCAT(
    'I just had a conversation with a startup founder. They''re building a ',
    sectors[1],
    ' company at ',
    stages[1],
    ' stage. ',
    CASE 
      WHEN check_sizes IS NOT NULL AND ARRAY_LENGTH(check_sizes, 1) > 0 
      THEN CONCAT('They''re looking to raise ', check_sizes[1], '. ')
      ELSE ''
    END,
    CASE 
      WHEN geos IS NOT NULL AND ARRAY_LENGTH(geos, 1) > 0 
      THEN CONCAT('The company is based in ', geos[1], '. ')
      ELSE ''
    END,
    'I think ',
    name,
    ' would be a great match for this. ',
    investment_focus,
    '. We should definitely introduce them.'
  ) as test_script,
  CONCAT(
    'Expected Match: ',
    name,
    ' (',
    ARRAY_TO_STRING(sectors, ', '),
    ' / ',
    ARRAY_TO_STRING(stages, ', '),
    ')'
  ) as expected_match
FROM contact_theses;

-- Alternative: Get a single comprehensive test script
SELECT 
  'Comprehensive Test Script' as script_title,
  CONCAT(
    'I had a really interesting conversation with a startup founder today. They''re building a ',
    (SELECT sectors[1] FROM theses WHERE contact_id IN (SELECT id FROM contacts WHERE owned_by_profile = auth.uid() LIMIT 1)),
    ' company at ',
    (SELECT stages[1] FROM theses WHERE contact_id IN (SELECT id FROM contacts WHERE owned_by_profile = auth.uid() LIMIT 1)),
    ' stage. ',
    'They''re looking to raise about $1.5 million. The company is based in San Francisco. ',
    'I think this could be a great opportunity for some of our contacts. ',
    'Maybe ',
    (SELECT name FROM contacts WHERE owned_by_profile = auth.uid() AND name IS NOT NULL LIMIT 1),
    ' would be a good match - they invest in ',
    (SELECT ARRAY_TO_STRING(sectors, ', ') FROM theses WHERE contact_id IN (SELECT id FROM contacts WHERE owned_by_profile = auth.uid() LIMIT 1)),
    ' at ',
    (SELECT ARRAY_TO_STRING(stages, ', ') FROM theses WHERE contact_id IN (SELECT id FROM contacts WHERE owned_by_profile = auth.uid() LIMIT 1)),
    '. We should definitely introduce them.'
  ) as test_script,
  'Multiple matches expected' as expected_match;

