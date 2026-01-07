-- Migration: Add Embedding Columns to Contacts Table
-- Version: 2025_02_01_contact_embeddings
-- Description: Adds bio, bio_embedding, and thesis_embedding columns for semantic matching

-- Step 1: Add bio column (if it doesn't exist)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Step 2: Add embedding columns
-- These store JSON arrays of embedding vectors (from OpenAI text-embedding-3-small)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS bio_embedding TEXT, -- JSON array as text
  ADD COLUMN IF NOT EXISTS thesis_embedding TEXT; -- JSON array as text

-- Step 3: Add comments for documentation
COMMENT ON COLUMN contacts.bio IS 'Contact biography/description for embedding generation';
COMMENT ON COLUMN contacts.bio_embedding IS 'Cached embedding vector (JSON array) for bio + title + company';
COMMENT ON COLUMN contacts.thesis_embedding IS 'Cached embedding vector (JSON array) for investor_notes/thesis';

-- Step 4: Create index for finding contacts without embeddings (for batch processing)
CREATE INDEX IF NOT EXISTS idx_contacts_missing_bio_embedding 
  ON contacts(owned_by_profile) 
  WHERE bio_embedding IS NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_missing_thesis_embedding 
  ON contacts(owned_by_profile) 
  WHERE thesis_embedding IS NULL;

