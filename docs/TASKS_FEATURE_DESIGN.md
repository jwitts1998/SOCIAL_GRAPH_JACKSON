# Tasks Feature Design

**Status**: Implementation Phase  
**Last Updated**: 2025-01-31

## Overview

The Tasks feature extracts actionable items from conversation transcripts and allows users to track follow-ups, commitments, and next steps. Tasks are automatically extracted when a conversation ends, and users can also create tasks manually.

## Task Types

### 1. User Action Items (`user_action`)
Tasks the primary user needs to complete:
- "Send follow-up email"
- "Schedule meeting with X"
- "Review pitch deck"
- "Send introduction to Y"
- "Prepare investment memo"
- "Follow up on investment decision"
- "Send term sheet"
- "Connect on LinkedIn"
- "Send thank you note"

### 2. Other Person Commitments (`other_commitment`)
Things the other participant(s) said they would do:
- "They said they'll send the deck"
- "They'll introduce us to X"
- "They'll review our proposal"
- "They'll get back to us next week"

### 3. Contact Creation (`create_contact`)
When a new person should be added to contacts:
- "Create contact for John Doe" (name mentioned but not in contacts)
- "Add Sarah to contacts" (explicit mention)

### 4. Meeting Scheduling (`schedule_meeting`)
Scheduling-related tasks:
- "Schedule follow-up call"
- "Set up coffee meeting"
- "Book demo session"

### 5. Document Sharing (`share_document`)
Document-related actions:
- "Send pitch deck"
- "Share term sheet"
- "Send company overview"
- "Forward investor deck"

### 6. Introduction Requests (`request_intro`)
Introduction-related tasks:
- "Request intro to X"
- "Ask for warm intro to Y"
- "Get connected to Z"

### 7. Research Tasks (`research`)
Research and information gathering:
- "Research company X"
- "Look into Y market"
- "Investigate Z technology"
- "Get more info on X"

### 8. Investment Actions (`investment_action`)
Investment-specific tasks:
- "Review term sheet"
- "Prepare investment memo"
- "Discuss investment terms"
- "Follow up on funding round"

### 9. Relationship Building (`relationship`)
Relationship maintenance:
- "Send thank you note"
- "Connect on LinkedIn"
- "Send holiday greeting"
- "Follow up on personal note"

## Database Schema

### `conversation_tasks` Table

```sql
CREATE TABLE conversation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- user_action, other_commitment, create_contact, etc.
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
```

**Indexes**:
- `idx_conversation_tasks_conversation_id` on `conversation_id`
- `idx_conversation_tasks_status` on `status`
- `idx_conversation_tasks_assigned_to` on `assigned_to`
- `idx_conversation_tasks_due_date` on `due_date` WHERE due_date IS NOT NULL

**RLS Policies**:
- Users can view tasks for their own conversations
- Users can create/update/delete their own tasks
- Service role can insert tasks (for Edge Functions)

## Data Flow

### Automatic Task Extraction (When Recording Ends)

```
1. User stops recording
   ↓
2. Conversation status → 'completed'
   ↓
3. Trigger: extract-tasks Edge Function
   ↓
4. GPT extracts tasks from transcript
   ↓
5. Tasks stored in conversation_tasks table
   ↓
6. Trigger: generate-summary Edge Function
   ↓
7. Summary includes tasks section
   ↓
8. UI displays tasks in conversation detail page
```

### Manual Task Creation

```
1. User clicks "Add Task" in conversation detail
   ↓
2. Task form opens
   ↓
3. User fills in task details
   ↓
4. Task saved to conversation_tasks table
   ↓
5. UI updates immediately
```

## Edge Function: extract-tasks

**File**: `supabase/functions/extract-tasks/index.ts`

**Input**:
```typescript
{
  conversationId: string
}
```

**Process**:
1. Fetch conversation transcript (recent segments)
2. Call GPT with task extraction prompt
3. Parse tasks from GPT response
4. Identify task type and assignee
5. For `create_contact` tasks, check if contact exists
6. Insert tasks into database

**GPT Prompt Structure**:
```
Extract actionable tasks and commitments from this VC/investor conversation.

Return a JSON array of tasks with:
- task_type: one of [user_action, other_commitment, create_contact, schedule_meeting, share_document, request_intro, research, investment_action, relationship]
- title: Short task title
- description: Detailed description
- assigned_to: 'user' if primary user should do it, 'other_participant' if other person committed
- other_participant_name: Name of other participant (if assigned_to is 'other_participant')
- priority: 'low' | 'medium' | 'high'
- due_date: ISO date string if mentioned, null otherwise

For create_contact tasks:
- Only create if person is mentioned by name and not already in contacts
- title: "Create contact for [Name]"
- description: Context about the person

Examples:
- "I'll send you the deck tomorrow" → user_action, assigned_to: 'user'
- "They said they'll review our proposal" → other_commitment, assigned_to: 'other_participant'
- "I should connect with John Doe" → create_contact (if John not in contacts)
```

**Output**:
```typescript
{
  tasks: Array<{
    task_type: string;
    title: string;
    description: string;
    assigned_to: string;
    other_participant_name?: string;
    priority: string;
    due_date?: string;
    linked_contact_id?: string;
  }>;
  extracted_count: number;
}
```

## UI Components

### 1. Tasks Section in Conversation Detail

**Location**: `client/src/pages/ConversationDetail.tsx`

**Features**:
- List of all tasks for the conversation
- Filter by status (pending, in_progress, completed, archived)
- Filter by assigned_to (user, other_participant)
- Filter by task_type
- Add task button
- Edit/delete task actions
- Mark complete action
- Archive action

### 2. Task Card Component

**File**: `client/src/components/TaskCard.tsx`

**Displays**:
- Task type badge
- Title and description
- Assigned to indicator
- Priority indicator
- Due date (if set)
- Status badge
- Actions (edit, delete, complete, archive)

### 3. Task Form Component

**File**: `client/src/components/TaskForm.tsx`

**Fields**:
- Task type (dropdown)
- Title (required)
- Description (optional)
- Assigned to (user/other_participant)
- Other participant name (if other_participant)
- Priority (low/medium/high)
- Due date (optional)
- Linked contact (for create_contact tasks)

## Integration Points

### 1. Recording End Flow

**File**: `client/src/components/RecordingDrawer.tsx`

**Update `handleStop` function**:
```typescript
// After conversation status → 'completed'
// 1. Extract tasks
await extractTasks(conversationId);

// 2. Generate summary (includes tasks)
await generateSummary(conversationId);
```

### 2. Summary Display

**File**: `client/src/pages/ConversationDetail.tsx`

**Update summary section** to include tasks:
- Show tasks in a dedicated section
- Link tasks to conversation summary

## Task Status Workflow

```
pending → in_progress → completed → archived
   ↓                        ↓
   └───────── archived ────┘
```

- **pending**: Newly created task
- **in_progress**: User started working on it
- **completed**: Task is done (can be archived)
- **archived**: Hidden from main view but preserved

## Future Features (Backlog)

1. **Send Tasks to Participants**: 
   - User can send task list to other conversation participants
   - Creates email with task assignments
   - Tracks who received the task list

2. **Task Templates**:
   - Pre-defined task templates for common scenarios
   - Quick-add common tasks

3. **Task Reminders**:
   - Email/notification reminders for due tasks
   - Calendar integration

4. **Task Analytics**:
   - Track completion rates
   - Time to complete tasks
   - Most common task types

## Implementation Plan

### Phase 1: Database & Extraction
1. Create migration for `conversation_tasks` table
2. Create `extract-tasks` Edge Function
3. Update recording end flow to trigger extraction
4. Test task extraction

### Phase 2: UI Components
1. Create TaskCard component
2. Create TaskForm component
3. Add tasks section to ConversationDetail
4. Add task CRUD operations

### Phase 3: Integration
1. Update summary generation to include tasks
2. Add tasks to conversation summary display
3. Test end-to-end flow

### Phase 4: Polish
1. Add task filtering/sorting
2. Add task status transitions
3. Add task archiving
4. Test manual task creation

## Success Metrics

- **Extraction Accuracy**: % of tasks correctly identified
- **User Adoption**: % of users creating manual tasks
- **Completion Rate**: % of tasks marked completed
- **Time to Action**: Average time from task creation to completion

