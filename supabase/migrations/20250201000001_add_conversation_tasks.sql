-- Migration: Add conversation_tasks table
-- Tracks actionable items extracted from conversations

CREATE TABLE IF NOT EXISTS conversation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- user_action, other_commitment, create_contact, schedule_meeting, share_document, request_intro, research, investment_action, relationship
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL, -- 'user' | 'other_participant' | 'system'
  other_participant_name TEXT, -- If assigned_to is 'other_participant'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'archived'
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  due_date TIMESTAMP,
  linked_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- For create_contact tasks
  created_by TEXT NOT NULL DEFAULT 'system', -- 'system' | 'user'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_conversation_tasks_conversation_id ON conversation_tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tasks_status ON conversation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_conversation_tasks_assigned_to ON conversation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversation_tasks_due_date ON conversation_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_tasks_task_type ON conversation_tasks(task_type);

-- Add RLS policies
ALTER TABLE conversation_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tasks for their own conversations
CREATE POLICY "Users can view their own conversation tasks"
  ON conversation_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tasks.conversation_id
      AND conversations.owned_by_profile = auth.uid()
    )
  );

-- Policy: Users can create tasks for their own conversations
CREATE POLICY "Users can create tasks for their own conversations"
  ON conversation_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tasks.conversation_id
      AND conversations.owned_by_profile = auth.uid()
    )
  );

-- Policy: Users can update tasks for their own conversations
CREATE POLICY "Users can update their own conversation tasks"
  ON conversation_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tasks.conversation_id
      AND conversations.owned_by_profile = auth.uid()
    )
  );

-- Policy: Users can delete tasks for their own conversations
CREATE POLICY "Users can delete their own conversation tasks"
  ON conversation_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tasks.conversation_id
      AND conversations.owned_by_profile = auth.uid()
    )
  );

-- Policy: Service role can insert tasks (for Edge Functions)
CREATE POLICY "Service role can insert conversation tasks"
  ON conversation_tasks
  FOR INSERT
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE conversation_tasks IS 'Tracks actionable items and commitments extracted from conversations';
COMMENT ON COLUMN conversation_tasks.task_type IS 'Type of task: user_action, other_commitment, create_contact, schedule_meeting, share_document, request_intro, research, investment_action, relationship';
COMMENT ON COLUMN conversation_tasks.assigned_to IS 'Who the task is assigned to: user (primary user), other_participant (other person in conversation), or system';
COMMENT ON COLUMN conversation_tasks.status IS 'Task status: pending, in_progress, completed, archived';
COMMENT ON COLUMN conversation_tasks.created_by IS 'Who created the task: system (auto-extracted) or user (manually created)';

