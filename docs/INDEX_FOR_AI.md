# Index for AI Agents

**If you're an AI agent working on this codebase, start here.**

## Quick Start

### Run Locally
```bash
npm install
npm run dev
```
Server starts on port 5000 (or `PORT` env var). Frontend served via Vite dev server.

### Test
```bash
npm run check  # TypeScript type checking
# Note: No test suite configured yet (see Gap Analysis)
```

### Build
```bash
npm run build  # Builds client + server
npm start      # Runs production build
```

## Architecture Overview

This is a **full-stack TypeScript application** with:
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js server (minimal, mostly OAuth routing)
- **Database**: Supabase PostgreSQL (with Row Level Security)
- **Auth**: Supabase Auth (email/password)
- **Serverless**: Supabase Edge Functions (Deno/TypeScript) for AI operations

### Key Directories

```
├── client/src/          # React frontend
│   ├── components/     # UI components (77 files)
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts (AuthContext)
│   └── lib/            # Utilities (supabase client, queryClient)
├── server/             # Express backend
│   ├── index.ts       # Server entry point
│   ├── routes.ts       # Route registration
│   └── routes/         # Route handlers (google-auth.ts)
├── shared/             # Shared TypeScript code
│   └── schema.ts       # Drizzle ORM schema (15 tables)
├── supabase/
│   ├── migrations/     # SQL migrations
│   └── functions/      # Edge Functions (8 functions)
└── attached_assets/   # User-uploaded assets (ignore in code)
```

## Data Flow

### Authentication Flow
1. User signs up/logs in via `AuthContext` → Supabase Auth
2. Session JWT stored in browser
3. Protected routes check `useAuth()` hook
4. API routes validate JWT via `supabase.auth.getUser(token)`

### CRUD Operations
- **Frontend → Supabase directly**: Most operations use Supabase SDK with RLS
- **No Express API layer**: Frontend calls Supabase tables directly
- **RLS policies**: Enforce user isolation at database level

### AI Operations (Edge Functions)
1. Frontend calls `supabase.functions.invoke('function-name', { body })`
2. Edge Function runs with service role (bypasses RLS)
3. Function validates user ownership before processing
4. Results written back to database

## Key Flows

### Recording a Conversation
1. User clicks "Record" → `Record` page
2. Browser captures audio via MediaRecorder API (5s chunks)
3. Audio sent to `transcribe-audio` Edge Function
4. Transcript segments written to `conversation_segments` (real-time)
5. After recording: `extract-participants` → `process-participants`
6. `extract-entities` extracts investment criteria
7. `generate-matches` scores contacts against entities
8. Matches displayed in real-time via Supabase subscriptions

### Contact Management
- CRUD via Supabase hooks (`useContacts.ts`)
- CSV import with validation
- Contact enrichment via `enrich-contact` Edge Function
- Pending contacts workflow (status: 'verified' | 'pending')

### Google Calendar Integration
- OAuth flow: `/api/auth/google/connect` → Google → `/callback`
- Tokens stored in `user_preferences` table
- Background sync via `sync-google-calendar` Edge Function
- Events linked to conversations via `event_id` foreign key

## Configuration

### Required Environment Variables

**📖 For detailed setup instructions, see [docs/SETUP.md](./SETUP.md)**

**Frontend (Vite):**
- `VITE_SUPABASE_URL` - Get from Supabase Dashboard → Settings → API
- `VITE_SUPABASE_ANON_KEY` - Get from Supabase Dashboard → Settings → API

**Backend (Express):**
- `PORT` - Server port (default: 5000)
- `VITE_SUPABASE_URL` - Supabase URL (shared)
- `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API
- `GOOGLE_CLIENT_ID` - Get from Google Cloud Console (optional, for Calendar)
- `GOOGLE_CLIENT_SECRET` - Get from Google Cloud Console (optional, for Calendar)
- `REPLIT_DEV_DOMAIN` - OAuth callback domain (Replit-specific)
- `DATABASE_URL` - PostgreSQL connection string (for Drizzle, legacy)

**Edge Functions (Supabase Secrets):**
- `OPENAI_API_KEY` - Get from OpenAI Platform → API Keys
- `HUNTER_API_KEY` - Get from Hunter.io (optional)
- `PDL_API_KEY` - Get from People Data Labs (optional)

### Where Config Lives
- **Replit Secrets**: Frontend env vars (VITE_*)
- **Supabase Dashboard → Settings → Edge Functions → Secrets**: Function secrets
- **`.env` files**: Not used (Replit uses Secrets UI)

## Database Schema

**Core Tables:**
- `profiles` - User profiles (linked to `auth.users`)
- `user_preferences` - User settings + Google OAuth tokens
- `contacts` - Network contacts
- `theses` - Investment criteria per contact

**Conversation Tables:**
- `conversations` - Recording sessions
- `conversation_participants` - Participants
- `conversation_segments` - Transcript lines (real-time)
- `conversation_entities` - Extracted entities

**Matching Tables:**
- `match_suggestions` - Scored matches (1-3 stars)
- `introduction_threads` - Double opt-in intro workflow
- `introduction_messages` - Email tracking

**Relationship Tables:**
- `relationship_events` - Interaction history
- `relationship_scores` - Relationship strength

**Calendar:**
- `calendar_events` - Google Calendar events

All tables have **Row Level Security (RLS)** enabled. Users can only access their own data.

## Common Patterns

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx` Router
3. Wrap with `<ProtectedRoute>` if auth required
4. Add nav item in `AppSidebar` if needed

### Adding a New Edge Function
1. Create `supabase/functions/function-name/index.ts`
2. Validate user ownership (check `conversation.owned_by_profile` or similar)
3. Use service role client: `createClient(url, serviceRoleKey)`
4. Deploy: `supabase functions deploy function-name`
5. Call from frontend: `supabase.functions.invoke('function-name', { body })`

### Adding a Database Table
1. Add table definition to `shared/schema.ts` (Drizzle ORM)
2. Create migration: `supabase migration new table_name`
3. Write SQL in migration file
4. Push: `supabase db push` (or `supabase migration up`)
5. Add RLS policies in migration

## Troubleshooting

### "Supabase credentials not configured"
- Check Replit Secrets for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart application after adding secrets

### Edge Function errors
- Check Supabase Dashboard → Edge Functions → Logs
- Verify secrets are set in Supabase Dashboard
- Check function validates user ownership

### Type errors
- Run `npm run check` to see TypeScript errors
- Ensure `shared/schema.ts` types match database
- Regenerate types: `supabase gen types typescript --linked > shared/supabase-types.ts`

### Database connection errors
- Verify `DATABASE_URL` is set (for Drizzle, legacy)
- Check Supabase project is active
- Run `supabase db diff` to check migration status

### OAuth errors
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check OAuth callback URL matches `REPLIT_DEV_DOMAIN`
- Ensure OAuth consent screen has test users added

## Security Notes

⚠️ **Critical Security Zones:**
- **Auth routes** (`server/routes/google-auth.ts`): Always validate JWT
- **Edge Functions**: Always verify user ownership before processing
- **RLS policies**: Never disable RLS, always test with different users
- **Service role key**: Only use in Edge Functions, never expose to frontend

## Extension Points

**Where to add new features:**
- **New pages**: `client/src/pages/` + route in `App.tsx`
- **New hooks**: `client/src/hooks/`
- **New UI components**: `client/src/components/ui/` (shadcn) or `components/` (custom)
- **New API routes**: `server/routes/` + register in `server/routes.ts`
- **New Edge Functions**: `supabase/functions/`
- **New database tables**: `shared/schema.ts` + migration

## Testing Strategy

**Current State:**
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ✅ TypeScript type checking (`npm run check`)

**Recommended:**
- Add Vitest for unit tests
- Add Playwright for E2E (user mentioned `run_test` tool)
- Test Edge Functions with Supabase CLI locally

## Next Steps

1. Read `docs/ARCHITECTURE.md` for deeper system overview
2. Read `docs/FLOWS.md` for visual flow diagrams
3. Check `.cursorrules` for coding conventions
4. Review `tasks/` directory for planned improvements

