# Matching System Documentation Index

**Last Updated**: 2025-01-31

## 📚 Documentation Overview

### Main Documentation Files

1. **`docs/CURRENT_MATCHING_SYSTEM.md`** ⭐ **START HERE**
   - Complete documentation of the current OpenAI-based matching system
   - How it works, limitations, code locations
   - Best resource for understanding the current implementation

2. **`docs/INDEX_FOR_AI.md`**
   - Overall system architecture
   - Quick start guide
   - How the system is set up (tech stack, data flow, key flows)
   - Good for understanding the full system context

3. **`docs/ARCHITECTURE.md`**
   - System architecture details
   - Technology stack
   - Component relationships

4. **`docs/PROCESS_CONVERSATION_PIPELINE.md`**
   - Step-by-step explanation of the "Process Conversation" pipeline
   - What happens when you click the button
   - Entity extraction + match generation flow

5. **`docs/DEBUGGING_MATCH_GENERATION.md`**
   - Troubleshooting guide
   - Common issues and solutions
   - Debug scripts and queries

## 🎯 Quick Reference

### How the Matching System Works (Current)

**File**: `supabase/functions/generate-matches/index.ts`

**Process**:
1. **Name Matching** (Rule-based): Matches `person_name` entities against contact names
2. **AI Matching** (GPT-3.5-turbo): Scores contacts based on thesis match
3. **Merge Results**: Combines both, removes duplicates

**Current Limitations**:
- 100 contact limit
- No nickname matching
- Basic fuzzy matching only
- No semantic search

## 🔗 Related Documentation

- **Test Scripts**: `docs/MATCHING_TEST_SCRIPTS.md`
- **v2 Design**: `docs/MATCHING_ENGINE_V2_DESIGN.md`
- **Progress Tracking**: `docs/MATCHING_V2_PROGRESS.md`

