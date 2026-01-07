# Social Graph Connector

A web application for VCs and investors to identify valuable introductions from conversations. Records conversations, extracts investment entities, matches them against a contact database, and generates introduction emails.

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- **Supabase account** (for database and auth) - [Sign up free](https://supabase.com)
- **OpenAI API key** (for AI operations) - [Get API key](https://platform.openai.com/api-keys)

**📖 New to this project?** See [docs/SETUP.md](docs/SETUP.md) for step-by-step credential setup.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server starts on port 5000 (or `PORT` environment variable). Frontend is served via Vite dev server.

### Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run check
```

## Environment Variables

### Quick Setup

**New to this project?** See [docs/SETUP.md](docs/SETUP.md) for step-by-step instructions on obtaining all credentials.

### Required Credentials

**For Frontend** (add to `.env` or Replit Secrets):
- `VITE_SUPABASE_URL` - Get from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api)
- `VITE_SUPABASE_ANON_KEY` - Get from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api)

**For Backend** (add to `.env` or Replit Secrets):
- `PORT` - Server port (default: 5000)
- `SUPABASE_SERVICE_ROLE_KEY` - Get from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api)
- `GOOGLE_CLIENT_ID` - Get from [Google Cloud Console](https://console.cloud.google.com) (optional, for Calendar)
- `GOOGLE_CLIENT_SECRET` - Get from [Google Cloud Console](https://console.cloud.google.com) (optional, for Calendar)
- `REPLIT_DEV_DOMAIN` - OAuth callback domain (Replit-specific, optional)
- `DATABASE_URL` - PostgreSQL connection string (legacy, for Drizzle)

**For Edge Functions** (set in Supabase Dashboard → Edge Functions → Secrets):
- `OPENAI_API_KEY` - Get from [OpenAI Platform → API Keys](https://platform.openai.com/api-keys)
- `HUNTER_API_KEY` - Get from [Hunter.io](https://hunter.io) (optional)
- `PDL_API_KEY` - Get from [People Data Labs](https://www.peopledatalabs.com) (optional)

**📖 Full Setup Guide**: See [docs/SETUP.md](docs/SETUP.md) for detailed instructions on obtaining each credential.

## Project Structure

```
├── client/src/          # React frontend
│   ├── components/     # UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   └── lib/            # Utilities
├── server/             # Express backend (minimal)
│   ├── index.ts       # Server entry point
│   └── routes/         # Route handlers
├── shared/             # Shared TypeScript code
│   └── schema.ts       # Database schema (Drizzle ORM)
├── supabase/
│   ├── migrations/     # SQL migrations
│   └── functions/      # Edge Functions
└── docs/              # Documentation
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js (minimal, OAuth only)
- **Database**: Supabase PostgreSQL (with Row Level Security)
- **Auth**: Supabase Auth
- **Serverless**: Supabase Edge Functions (Deno/TypeScript)
- **AI**: OpenAI (Whisper + GPT-4)

## Key Features

- **Conversation Recording**: Record audio with real-time transcription
- **Entity Extraction**: Automatically extract investment criteria (sectors, stages, check sizes)
- **Contact Matching**: Score contacts against conversation entities (1-3 stars)
- **Introduction Workflow**: Generate double opt-in introduction emails
- **Google Calendar Integration**: Sync calendar events and link to conversations
- **Contact Management**: CRUD operations, CSV import, contact enrichment
- **Real-time Updates**: Live transcript updates via Supabase Realtime

## Documentation

- **[Setup Guide](docs/SETUP.md)** - **START HERE** - Step-by-step credential setup
- **[Index for AI Agents](docs/INDEX_FOR_AI.md)** - Start here if you're an AI agent
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design decisions
- **[Flows](docs/FLOWS.md)** - Visual flow diagrams (Mermaid)
- **[Design Guidelines](design_guidelines.md)** - UI/UX design principles
- **[Supabase Setup](SUPABASE_SETUP.md)** - Database setup guide

## Development Workflow

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow coding conventions in `.cursorrules`
3. **Type check**: Run `npm run check`
4. **Test locally**: Run `npm run dev` and test manually
5. **Commit**: Use conventional commits (`feat:`, `fix:`, etc.)
6. **Push and PR**: Create pull request

## Database Migrations

### Create a new migration

```bash
supabase migration new migration_name
```

### Apply migrations

```bash
supabase db push
```

### Check migration status

```bash
supabase db diff
```

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

## Edge Functions

### Deploy a function

```bash
supabase functions deploy function-name
```

### View logs

```bash
supabase functions logs function-name
```

### Set secrets

Go to Supabase Dashboard → Edge Functions → Secrets

## Troubleshooting

### "Supabase credentials not configured"

- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the application after adding secrets

### Type errors

- Run `npm run check` to see TypeScript errors
- Ensure `shared/schema.ts` types match database
- Regenerate types: `supabase gen types typescript --linked > shared/supabase-types.ts`

### Database connection errors

- Verify `DATABASE_URL` is set (for Drizzle, legacy)
- Check Supabase project is active
- Run `supabase db diff` to check migration status

### Edge Function errors

- Check Supabase Dashboard → Edge Functions → Logs
- Verify secrets are set in Supabase Dashboard
- Check function validates user ownership

## Security

⚠️ **Important Security Notes:**

- **RLS is enabled**: All database tables have Row Level Security
- **Service role key**: Only used in Edge Functions, never exposed to frontend
- **OAuth validation**: Always validate JWT tokens in API routes
- **Ownership checks**: Edge Functions must verify user ownership before processing

See `.cursorrules` for detailed security guidelines.

## Contributing

1. Read `.cursorrules` for coding conventions
2. Follow the design guidelines in `design_guidelines.md`
3. Add tests for new features (when test suite is set up)
4. Update documentation if adding new features
5. Keep PRs small and focused

## License

MIT

## Support

For issues or questions:
1. Check the [documentation](docs/)
2. Review [troubleshooting](#troubleshooting) section
3. Check existing issues/PRs
4. Create a new issue with details

