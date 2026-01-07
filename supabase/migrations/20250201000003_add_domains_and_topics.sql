-- Migration: Add rich context columns to conversations table
-- Version: 2025_02_01_rich_context_columns
-- Description: Adds columns that extract-entities function expects for rich context storage

-- Add all rich context columns (JSONB for flexibility)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS target_person JSONB,
  ADD COLUMN IF NOT EXISTS matching_intent JSONB,
  ADD COLUMN IF NOT EXISTS goals_and_needs JSONB,
  ADD COLUMN IF NOT EXISTS domains_and_topics JSONB;

-- Add comments for documentation
COMMENT ON COLUMN conversations.target_person IS 'Extracted target person information from conversation (stored as JSONB)';
COMMENT ON COLUMN conversations.matching_intent IS 'Matching intent and preferences (stored as JSONB)';
COMMENT ON COLUMN conversations.goals_and_needs IS 'Extracted goals and needs from conversation (stored as JSONB)';
COMMENT ON COLUMN conversations.domains_and_topics IS 'Extracted domains and topics from conversation (stored as JSONB)';

