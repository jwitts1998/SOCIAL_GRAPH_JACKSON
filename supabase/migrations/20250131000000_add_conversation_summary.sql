-- Add summary field to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_conversations_summary ON conversations(summary) WHERE summary IS NOT NULL;

