-- Migration: Add Matching Engine v2 fields
-- Adds explainability, confidence scores, and match history support

-- Add new fields to match_suggestions table
ALTER TABLE match_suggestions 
  ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS semantic_similarity DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS matching_details JSONB,
  ADD COLUMN IF NOT EXISTS entity_matches JSONB,
  ADD COLUMN IF NOT EXISTS contact_field_matches JSONB;

-- Add entity_embedding to conversations table for caching
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS entity_embedding TEXT;

-- Create match_history table for tracking match evolution
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_suggestion_id UUID REFERENCES match_suggestions(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  confidence DECIMAL(3,2),
  semantic_similarity DECIMAL(5,4),
  matching_details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_match_history_match_suggestion_id ON match_history(match_suggestion_id);
CREATE INDEX IF NOT EXISTS idx_match_history_conversation_id ON match_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_match_history_created_at ON match_history(created_at);

-- Add RLS policies for match_history
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see match history for their own conversations
CREATE POLICY "Users can view their own match history"
  ON match_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = match_history.conversation_id
      AND conversations.owned_by_profile = auth.uid()
    )
  );

-- Policy: Service role can insert match history (for Edge Functions)
CREATE POLICY "Service role can insert match history"
  ON match_history
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON COLUMN match_suggestions.confidence IS 'GPT confidence score (0.0-1.0) for this match';
COMMENT ON COLUMN match_suggestions.semantic_similarity IS 'Embedding-based similarity score (0.0-1.0)';
COMMENT ON COLUMN match_suggestions.matching_details IS 'Detailed matching breakdown including reasoning, entity matches, and score breakdown';
COMMENT ON COLUMN match_suggestions.entity_matches IS 'Which conversation entities matched which contact fields';
COMMENT ON COLUMN match_suggestions.contact_field_matches IS 'Detailed field-level matching information';
COMMENT ON COLUMN conversations.entity_embedding IS 'Cached embedding for conversation entities (JSON array as text)';
COMMENT ON TABLE match_history IS 'Tracks match evolution over time for explainability and debugging';

