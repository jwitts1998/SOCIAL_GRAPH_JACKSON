-- Diagnostic script to check user data after sign-in
-- Run this in Supabase SQL Editor after signing in
-- This will help identify if data exists but isn't accessible

-- First, let's check if we can see the current authenticated user
-- (This query should be run while authenticated)
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- Check if profile exists for current user
SELECT 
  id,
  email,
  full_name,
  created_at
FROM profiles
WHERE id = auth.uid();

-- Check user_preferences
SELECT 
  profile_id,
  auto_transcribe,
  notification_email,
  created_at
FROM user_preferences
WHERE profile_id = auth.uid();

-- Check contacts count (should be visible due to RLS)
SELECT 
  COUNT(*) as contact_count
FROM contacts
WHERE owned_by_profile = auth.uid();

-- Check a few sample contacts (first 5)
SELECT 
  id,
  name,
  email,
  company,
  created_at
FROM contacts
WHERE owned_by_profile = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- Check conversations count
SELECT 
  COUNT(*) as conversation_count
FROM conversations
WHERE owned_by_profile = auth.uid();

-- Check a few sample conversations
SELECT 
  id,
  title,
  recorded_at,
  status,
  created_at
FROM conversations
WHERE owned_by_profile = auth.uid()
ORDER BY recorded_at DESC
LIMIT 5;

-- If the above queries return 0 rows, check if profiles exist at all
-- (This requires service role or admin access)
-- SELECT COUNT(*) as total_profiles FROM profiles;

