#!/bin/bash

# Tasks Feature Test Script
# Run this script to test the tasks feature end-to-end

set -e

echo "🧪 Tasks Feature Test Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking database migration...${NC}"
echo "Run this SQL in Supabase Dashboard to verify:"
echo ""
echo "SELECT table_name FROM information_schema.tables WHERE table_name = 'conversation_tasks';"
echo ""
read -p "Press Enter when you've verified the table exists..."

echo ""
echo -e "${YELLOW}Step 2: Deploying extract-tasks function...${NC}"
supabase functions deploy extract-tasks

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Function deployed successfully${NC}"
else
    echo -e "${RED}❌ Function deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Testing function...${NC}"
echo "To test the function:"
echo "1. Go to Supabase Dashboard → Edge Functions → extract-tasks"
echo "2. Click 'Invoke' tab"
echo "3. Use this payload (replace with your conversation ID):"
echo ""
cat << 'EOF'
{
  "conversationId": "your-conversation-id-here"
}
EOF
echo ""
read -p "Press Enter when you've tested the function..."

echo ""
echo -e "${YELLOW}Step 4: Getting test conversation ID...${NC}"
echo "Run this SQL in Supabase Dashboard:"
echo ""
cat << 'EOF'
SELECT 
  c.id,
  c.title,
  COUNT(cs.id) as segment_count
FROM conversations c
LEFT JOIN conversation_segments cs ON cs.conversation_id = c.id
GROUP BY c.id, c.title
HAVING COUNT(cs.id) > 10
ORDER BY c.created_at DESC
LIMIT 1;
EOF
echo ""
read -p "Enter the conversation ID you want to test with: " CONVERSATION_ID

if [ -z "$CONVERSATION_ID" ]; then
    echo -e "${RED}❌ No conversation ID provided${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Testing task extraction...${NC}"
echo "Testing with conversation ID: $CONVERSATION_ID"
echo ""
echo "You can test via:"
echo "1. Supabase Dashboard → Edge Functions → extract-tasks → Invoke"
echo "2. Or use curl (see docs/TASKS_FEATURE_TEST_SCRIPT.md)"
echo ""
read -p "Press Enter when you've extracted tasks..."

echo ""
echo -e "${YELLOW}Step 6: Verifying tasks in database...${NC}"
echo "Run this SQL to check extracted tasks:"
echo ""
echo "SELECT id, task_type, title, assigned_to, status, priority"
echo "FROM conversation_tasks"
echo "WHERE conversation_id = '$CONVERSATION_ID'"
echo "ORDER BY created_at DESC;"
echo ""
read -p "Press Enter when you've verified tasks exist..."

echo ""
echo -e "${YELLOW}Step 7: Testing UI...${NC}"
echo "1. Open your app in browser"
echo "2. Navigate to: /conversation/$CONVERSATION_ID"
echo "3. Click on 'Tasks' tab"
echo "4. Verify tasks are displayed"
echo ""
read -p "Press Enter when you've verified UI displays tasks..."

echo ""
echo -e "${YELLOW}Step 8: Testing manual task creation...${NC}"
echo "1. Click 'Add Task' button"
echo "2. Fill in the form"
echo "3. Create the task"
echo "4. Verify it appears in the list"
echo ""
read -p "Press Enter when you've created a task manually..."

echo ""
echo -e "${YELLOW}Step 9: Testing task operations...${NC}"
echo "Test these operations:"
echo "- Edit a task"
echo "- Complete a task"
echo "- Archive a task"
echo "- Delete a task"
echo ""
read -p "Press Enter when you've tested all operations..."

echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "If all steps passed, the feature is working correctly."
echo "Check docs/TASKS_FEATURE_TEST_SCRIPT.md for detailed test cases."

