# Architecture Documentation

## System Overview

**Social Graph Connector** is a full-stack web application for VCs and investors to identify valuable introductions from conversations. It records conversations, extracts investment entities, matches them against a contact database, and generates introduction emails.

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.6.3
- **Build Tool**: Vite 5.4.20
- **Routing**: Wouter 3.3.5
- **State Management**: TanStack Query 5.60.5 (server state) + React Context (auth)
- **Styling**: Tailwind CSS 3.4.17 + shadcn/ui components
- **Forms**: React Hook Form 7.55.0 + Zod 3.24.2
- **Icons**: Lucide React 0.453.0

### Backend
- **Runtime**: Node.js 20 (via tsx 4.20.5)
- **Framework**: Express 4.21.2
- **Purpose**: Minimal server for OAuth routing and static file serving
- **Database Access**: Direct Supabase SDK calls from frontend (no Express API layer)

### Database & Infrastructure
- **Database**: Supabase PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM 0.39.1 (schema definition only, not used for queries)
- **Auth**: Supabase Auth (email/password)
- **Serverless**: Supabase Edge Functions (Deno runtime)
- **Realtime**: Supabase Realtime subscriptions

### External Services
- **OpenAI**: Whisper (transcription) + GPT-4 (entity extraction, matching, email generation)
- **Hunter.io**: Email finding and verification
- **People Data Labs**: Person enrichment (LinkedIn, job history)
- **Google Calendar**: OAuth integration for event sync

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React App (Vite)                                 │  │
│  │  • Pages (Home, Record, Contacts, History)       │  │
│  │  • Components (UI, Forms, Sidebar)               │  │
│  │  • Hooks (useContacts, useConversations, etc.)   │  │
│  │  • Contexts (AuthContext)                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│  Express Server  │              │   Supabase SDK   │
│  (Port 5000)     │              │  (Direct Access) │
│                  │              │                  │
│  • OAuth routes  │              │  • CRUD ops      │
│  • Static files  │              │  • Auth          │
│  • Vite dev      │              │  • Realtime      │
└──────────────────┘              └──────────────────┘
        │                                   │
        │                                   ↓
        │                          ┌──────────────────┐
        │                          │   Supabase      │
        │                          │   Platform      │
        │                          ├──────────────────┤
        │                          │  • PostgreSQL   │
        │                          │  • Auth         │
        │                          │  • Edge Funcs   │
        │                          │  • Realtime     │
        │                          └──────────────────┘
        │                                   │
        └───────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│  Google OAuth    │              │   OpenAI API     │
│  (Calendar)      │              │  (AI Operations)  │
└──────────────────┘              └──────────────────┘
```

## Component Architecture

### Frontend Layers

**1. Pages Layer** (`client/src/pages/`)
- Route-level components
- Composed of multiple components
- Handle page-level state and navigation

**2. Components Layer** (`client/src/components/`)
- Reusable UI components
- `ui/` - shadcn/ui primitives (Button, Dialog, etc.)
- Custom components (AppSidebar, ThemeToggle, etc.)

**3. Hooks Layer** (`client/src/hooks/`)
- Data fetching hooks (useContacts, useConversations)
- Business logic hooks (useMeetingNotifications, useGoogleCalendarSync)
- Custom React hooks for reusable logic

**4. Contexts Layer** (`client/src/contexts/`)
- `AuthContext` - Authentication state and methods
- Provides user session, sign in/out, password reset

**5. Lib Layer** (`client/src/lib/`)
- `supabase.ts` - Supabase client initialization
- `queryClient.ts` - TanStack Query configuration
- `edgeFunctions.ts` - Edge Function invocation helpers

### Backend Layers

**1. Routes Layer** (`server/routes/`)
- `google-auth.ts` - Google OAuth flow handlers
- Minimal Express routes (only OAuth needed)

**2. Server Entry** (`server/index.ts`)
- Express app setup
- Middleware (JSON parsing, logging)
- Route registration
- Vite dev server integration (dev mode)

### Shared Layer

**Schema** (`shared/schema.ts`)
- Drizzle ORM table definitions
- Zod validation schemas
- TypeScript type exports
- Single source of truth for database structure

## Data Flow Patterns

### Pattern 1: Direct Supabase Access (Most Common)
```
Component → Hook → Supabase SDK → PostgreSQL (RLS) → Response
```
**Example**: Fetching contacts
- Component calls `useContacts()`
- Hook uses `supabase.from('contacts').select()`
- RLS enforces user isolation
- Data returned to component

### Pattern 2: Edge Function Invocation
```
Component → Hook → supabase.functions.invoke() → Edge Function → OpenAI → Database
```
**Example**: Transcribing audio
- Component calls `transcribeAudio(audioBlob)`
- Edge Function receives audio, calls OpenAI Whisper
- Transcript segments written to database
- Real-time subscription updates UI

### Pattern 3: OAuth Flow
```
Frontend → Express /api/auth/google/connect → Google OAuth → Callback → Database
```
**Example**: Google Calendar connection
- User clicks "Connect Calendar"
- Express route initiates OAuth
- Google redirects to callback
- Tokens stored in `user_preferences` table

## Dependency Boundaries

### Frontend → Backend
- **Minimal coupling**: Only OAuth routes
- Frontend is mostly self-contained
- No REST API layer (uses Supabase directly)

### Frontend → Supabase
- **Direct dependency**: Supabase SDK used throughout
- RLS policies enforce security (no backend validation needed)
- Real-time subscriptions for live updates

### Edge Functions → Database
- **Service role access**: Bypasses RLS for AI operations
- **Ownership validation**: Functions must verify user ownership
- **Isolation**: Each function validates before processing

### External Services
- **OpenAI**: Called from Edge Functions only
- **Google**: OAuth via Express, Calendar API via Edge Functions
- **Hunter.io / PDL**: Called from `enrich-contact` Edge Function

## Key Components

### Authentication System
- **Provider**: Supabase Auth
- **Storage**: JWT in browser localStorage
- **Context**: `AuthContext` wraps app
- **Protection**: `ProtectedRoute` component checks auth state
- **Backend validation**: `supabase.auth.getUser(token)` in API routes

### Real-time System
- **Provider**: Supabase Realtime
- **Usage**: Subscriptions to `conversation_segments` for live transcripts
- **Pattern**: `supabase.channel().on('INSERT', callback).subscribe()`

### State Management
- **Server state**: TanStack Query (caching, refetching, mutations)
- **Client state**: React useState/useReducer
- **Global state**: React Context (auth only)
- **No Redux/Zustand**: Keeping it simple

### Styling System
- **Framework**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Design**: Inspired by Linear/Granola (high density, professional)
- **Theme**: Dark/light mode via `next-themes`

## Extension Points

### Adding a New Feature

**1. New Page/Route**
- Add component to `client/src/pages/`
- Register route in `client/src/App.tsx`
- Add navigation item in `AppSidebar`

**2. New Data Entity**
- Add table to `shared/schema.ts`
- Create migration in `supabase/migrations/`
- Add RLS policies
- Create hook in `client/src/hooks/` (e.g., `useEntity.ts`)

**3. New AI Operation**
- Create Edge Function in `supabase/functions/`
- Validate user ownership
- Call external APIs (OpenAI, etc.)
- Write results to database
- Invoke from frontend via `edgeFunctions.ts` helpers

**4. New External Integration**
- Add OAuth route in `server/routes/` (if needed)
- Store tokens in `user_preferences` or dedicated table
- Create Edge Function for API calls
- Add UI in Settings page

## Security Architecture

### Row Level Security (RLS)
- **All tables**: RLS enabled
- **Policy pattern**: `(auth.uid() = owned_by_profile)`
- **Service role**: Only used in Edge Functions
- **Frontend**: Always uses anon key (RLS enforces isolation)

### Authentication
- **JWT tokens**: Supabase Auth manages
- **Session storage**: Browser localStorage
- **API validation**: `supabase.auth.getUser(token)` in Express routes
- **Edge Functions**: Receive JWT in headers, validate before processing

### Data Isolation
- **User data**: Isolated by `owned_by_profile` foreign keys
- **Shared contacts**: `contact_shares` table with explicit permissions
- **Cross-user access**: Only via `contact_shares` with `access_level`

## Performance Considerations

### Frontend
- **Code splitting**: Vite handles automatically
- **Lazy loading**: Not implemented (could add React.lazy for routes)
- **Caching**: TanStack Query caches API responses
- **Real-time**: Efficient subscriptions (only subscribed when needed)

### Backend
- **Minimal server**: Express only for OAuth (low overhead)
- **Edge Functions**: Serverless, auto-scaling
- **Database**: Supabase handles connection pooling

### Database
- **Indexes**: Added in migrations (check `supabase/migrations/`)
- **RLS**: Minimal performance impact (PostgreSQL native)
- **Queries**: Direct Supabase queries (no ORM overhead)

## Deployment

### Current Setup
- **Platform**: Replit (autoscale deployment)
- **Build**: `npm run build` (Vite + esbuild)
- **Start**: `npm start` (runs `dist/index.js`)
- **Port**: 5000 (or `PORT` env var)

### Edge Functions
- **Deploy**: `supabase functions deploy function-name`
- **Secrets**: Set in Supabase Dashboard
- **Logs**: View in Supabase Dashboard → Edge Functions → Logs

### Database
- **Migrations**: `supabase db push` (or manual SQL in dashboard)
- **Backup**: Supabase handles automatically
- **Monitoring**: Supabase Dashboard → Database

## Known Limitations

1. **No test suite**: Unit/integration/E2E tests missing
2. **No linting**: ESLint/Prettier not configured
3. **Legacy Drizzle**: Schema defined but queries use Supabase SDK
4. **In-memory OAuth state**: Should use Redis in production
5. **No error tracking**: No Sentry/error monitoring
6. **No analytics**: No user behavior tracking

## Future Improvements

See `tasks/` directory for prioritized improvement backlog.

