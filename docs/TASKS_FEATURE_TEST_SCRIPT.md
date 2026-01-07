# Tasks Feature Test Script

**Feature**: Conversation Tasks Extraction & Management  
**Date**: 2025-01-31

## Prerequisites

1. ✅ Database migration applied (`20250201000001_add_conversation_tasks.sql`)
2. ✅ `extract-tasks` Edge Function deployed
3. ✅ Frontend code updated and running
4. ✅ You have at least one completed conversation in your database

---

## Test 1: Database Migration Verification

### Step 1: Check Table Exists

Run in Supabase SQL Editor:
```sql
-- Check if conversation_tasks table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'conversation_tasks';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_tasks'
ORDER BY ordinal_position;
```

**Expected Result**: 
- Table exists
- Has all columns: id, conversation_id, task_type, title, description, assigned_to, etc.

### Step 2: Check RLS Policies

```sql
-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'conversation_tasks';
```

**Expected Result**: 
- 5 policies: SELECT, INSERT (user), INSERT (service), UPDATE, DELETE

### Step 3: Check Indexes

```sql
-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'conversation_tasks';
```

**Expected Result**: 
- 5 indexes created

---

## Test 2: Edge Function Deployment

### Step 1: Deploy Function

```bash
cd /Users/jacksonwittenberg/dev/projects/Social_Graph_Jackson
supabase functions deploy extract-tasks
```

**Expected Result**: Function deploys successfully

### Step 2: Test Function Manually

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Find `extract-tasks`
3. Click "Invoke" tab
4. Use this payload (replace with real conversation ID):
```json
{
  "conversationId": "your-conversation-id-here"
}
```

**Option B: Via curl**
```bash
# Get your conversation ID first (see Test 3)
curl -X POST \
  'https://mtelyxosqqaeadrrrtgk.supabase.co/functions/v1/extract-tasks' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "conversationId": "your-conversation-id-here"
  }'
```

**Expected Response**:
```json
{
  "tasks": [
    {
      "id": "...",
      "task_type": "user_action",
      "title": "Send follow-up email",
      "description": "...",
      "assigned_to": "user",
      "status": "pending",
      "priority": "medium"
    }
  ],
  "extracted_count": 3
}
```

**What to Check**:
- ✅ Function returns tasks array
- ✅ Tasks have correct structure
- ✅ Tasks are inserted into database

---

## Test 3: Get Test Conversation ID

### Step 1: Find a Conversation with Transcript

Run in Supabase SQL Editor:
```sql
-- Get a conversation with transcript segments
SELECT 
  c.id,
  c.title,
  c.status,
  COUNT(cs.id) as segment_count
FROM conversations c
LEFT JOIN conversation_segments cs ON cs.conversation_id = c.id
GROUP BY c.id, c.title, c.status
HAVING COUNT(cs.id) > 10
ORDER BY c.created_at DESC
LIMIT 1;
```

**Save the `id`** - you'll use it for testing.

### Step 2: Verify Conversation Has Content

```sql
-- Check transcript content (replace with your conversation ID)
SELECT text
FROM conversation_segments
WHERE conversation_id = 'your-conversation-id'
ORDER BY timestamp_ms
LIMIT 5;
```

**Expected**: Should see transcript text

---

## Test 4: Test Task Extraction (Manual)

### Step 1: Extract Tasks for Existing Conversation

Use the conversation ID from Test 3 and call the extract-tasks function (see Test 2).

### Step 2: Verify Tasks in Database

```sql
-- Check extracted tasks (replace with your conversation ID)
SELECT 
  id,
  task_type,
  title,
  description,
  assigned_to,
  status,
  priority,
  due_date,
  created_by
FROM conversation_tasks
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at DESC;
```

**Expected**:
- ✅ Tasks are inserted
- ✅ `created_by` = 'system'
- ✅ Tasks have meaningful titles and descriptions
- ✅ Task types are appropriate

### Step 3: Check Task Quality

**Manual Review**:
- Do the extracted tasks make sense?
- Are they actionable?
- Are task types correct?
- Are priorities reasonable?

---

## Test 5: Test Full Recording Flow

### Step 1: Start Recording

1. Open the app
2. Navigate to Record page or open RecordingDrawer
3. Start a new recording
4. Speak for at least 1-2 minutes with actionable items:
   - "I'll send you the deck tomorrow"
   - "They said they'll review our proposal"
   - "I should connect with John Doe"
   - "Let's schedule a follow-up call next week"

### Step 2: Stop Recording

1. Stop the recording
2. Watch the console for logs:
   - `📋 Extracting tasks...`
   - `✅ Extracted X tasks`
   - `📝 Generating summary...`
   - `✅ Summary generated`

### Step 3: Navigate to Conversation Detail

1. You should be redirected to conversation detail page
2. Click on "Tasks" tab
3. Verify tasks are displayed

**Expected**:
- ✅ Tasks tab shows extracted tasks
- ✅ Tasks have correct types, priorities
- ✅ Tasks are actionable

---

## Test 6: Test Manual Task Creation

### Step 1: Create Task via UI

1. Go to Conversation Detail page
2. Click "Tasks" tab
3. Click "Add Task" button
4. Fill in form:
   - Task Type: "Action Item"
   - Title: "Test manual task"
   - Description: "This is a test task created manually"
   - Assigned To: "You"
   - Priority: "High"
   - Due Date: Tomorrow's date
5. Click "Create Task"

**Expected**:
- ✅ Task form opens
- ✅ Form validates correctly
- ✅ Task is created and appears in list
- ✅ Toast notification appears

### Step 2: Verify in Database

```sql
-- Check manually created task
SELECT *
FROM conversation_tasks
WHERE created_by = 'user'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- ✅ `created_by` = 'user'
- ✅ All fields are saved correctly

---

## Test 7: Test Task Status Transitions

### Step 1: Start Task

1. Find a task with status "pending"
2. Click "Start" button
3. Verify status changes to "in_progress"

**Expected**:
- ✅ Status updates immediately
- ✅ UI reflects new status
- ✅ Toast notification appears

### Step 2: Complete Task

1. Find a task with status "in_progress" or "pending"
2. Click "Complete" button
3. Verify status changes to "completed"

**Expected**:
- ✅ Status updates to "completed"
- ✅ Task shows completed styling
- ✅ "Archive" button appears

### Step 3: Archive Task

1. Find a completed task
2. Click "Archive" button
3. Verify task moves to archived section

**Expected**:
- ✅ Task disappears from main list
- ✅ Appears in "Archived Tasks" section (collapsed)
- ✅ Can still view archived tasks

---

## Test 8: Test Task Editing

### Step 1: Edit Task

1. Find any task
2. Click "Edit" button (pencil icon)
3. Modify:
   - Change title
   - Change priority
   - Change due date
4. Click "Update Task"

**Expected**:
- ✅ Form opens with existing values
- ✅ Changes are saved
- ✅ UI updates immediately
- ✅ Toast notification appears

---

## Test 9: Test Task Deletion

### Step 1: Delete Task

1. Find a task
2. Click "Delete" button (trash icon)
3. Confirm deletion in dialog
4. Verify task is removed

**Expected**:
- ✅ Confirmation dialog appears
- ✅ Task is deleted from database
- ✅ Task disappears from UI
- ✅ Toast notification appears

---

## Test 10: Test Task Filtering

### Step 1: Check Status Badges

1. Go to Tasks tab
2. Look at status badges at top
3. Verify counts match actual tasks

**Expected**:
- ✅ Badges show correct counts
- ✅ Badges only appear if count > 0

### Step 2: Verify Archived Section

1. Complete and archive a task
2. Scroll to bottom of tasks list
3. Expand "Archived Tasks" section
4. Verify archived task appears

**Expected**:
- ✅ Archived section is collapsible
- ✅ Shows correct count
- ✅ Archived tasks are displayed

---

## Test 11: Test Edge Cases

### Test 11.1: Empty Conversation

1. Create a conversation with no transcript
2. Try to extract tasks
3. Verify graceful handling

**Expected**: 
- ✅ No error
- ✅ Returns empty tasks array or message

### Test 11.2: Conversation with No Actionable Items

1. Use a conversation with only small talk
2. Extract tasks
3. Verify behavior

**Expected**:
- ✅ Returns empty or minimal tasks
- ✅ No errors

### Test 11.3: Very Long Conversation

1. Use a conversation with 100+ segments
2. Extract tasks
3. Verify it processes correctly

**Expected**:
- ✅ Processes all segments
- ✅ Extracts relevant tasks
- ✅ No timeout errors

---

## Test 12: Test Integration with Summary

### Step 1: Generate Summary

1. Go to conversation with tasks
2. Go to "Overview" tab
3. Click "Generate Summary" (if not already generated)
4. Verify summary includes tasks

**Expected**:
- ✅ Summary is generated
- ✅ Summary mentions tasks (if summary generation is updated)

**Note**: Summary integration is pending (todo #4)

---

## Expected Results Summary

### ✅ All Tests Should Pass

- Database migration: Table and policies created
- Edge Function: Deploys and extracts tasks correctly
- UI Components: All CRUD operations work
- Status Transitions: All status changes work
- Manual Creation: Users can create tasks
- Auto-extraction: Tasks extracted on recording end
- Filtering: Status badges and archived section work

---

## Troubleshooting

### Issue: Tasks not extracted

**Check**:
1. Is `extract-tasks` function deployed?
2. Does conversation have transcript segments?
3. Check Edge Function logs in Supabase Dashboard
4. Check browser console for errors

### Issue: Tasks not displayed

**Check**:
1. Is migration applied?
2. Are tasks in database? (run SQL query)
3. Check browser console for errors
4. Check RLS policies allow user to view tasks

### Issue: Can't create tasks manually

**Check**:
1. Is user authenticated?
2. Does conversation belong to user?
3. Check browser console for errors
4. Check RLS policies allow user to insert tasks

### Issue: TypeScript errors

**Fix**:
```bash
npm run check
# Fix any errors shown
```

---

## Quick Test Checklist

- [ ] Migration applied
- [ ] Function deployed
- [ ] Can extract tasks for existing conversation
- [ ] Tasks appear in database
- [ ] Tasks display in UI
- [ ] Can create task manually
- [ ] Can edit task
- [ ] Can delete task
- [ ] Can complete task
- [ ] Can archive task
- [ ] Status transitions work
- [ ] Filtering works
- [ ] Auto-extraction works on recording end

---

## Next Steps After Testing

1. If all tests pass → Feature is ready!
2. If issues found → Document and fix
3. Update summary generation to include tasks (todo #4)
4. Add task analytics/metrics (future)

---

## Test Data Examples

### Good Test Conversation Transcript

```
"I'll send you the pitch deck by Friday. 
They said they'll review our proposal next week.
I should connect with Sarah Johnson from TechCorp.
Let's schedule a follow-up call for next month.
I need to research the AI market more.
Can you send me the term sheet?
I'll prepare the investment memo this weekend."
```

**Expected Tasks**:
- user_action: "Send pitch deck" (due: Friday)
- other_commitment: "They'll review proposal" (assigned: other_participant)
- create_contact: "Create contact for Sarah Johnson"
- schedule_meeting: "Schedule follow-up call"
- research: "Research AI market"
- share_document: "Send term sheet"
- investment_action: "Prepare investment memo"

---

## Performance Benchmarks

- **Task Extraction**: < 30 seconds for typical conversation
- **UI Load Time**: < 1 second to display tasks
- **Task Creation**: < 500ms
- **Status Update**: < 500ms

---

## Success Criteria

✅ **Feature is working if**:
1. Tasks are automatically extracted when recording ends
2. Tasks are displayed correctly in UI
3. All CRUD operations work
4. Status transitions work smoothly
5. No errors in console or logs
6. Tasks are persisted in database correctly

