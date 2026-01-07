# Cursor Optimization Analysis

**Date**: 2025-01-17  
**Repository**: Social Graph Connector  
**Analysis Type**: Cursor Optimization for AI-Assisted Development

---

## 1. Repo Snapshot

### Stack & Versions

**Language**: TypeScript 5.6.3  
**Runtime**: Node.js 20  
**Package Manager**: npm

**Frontend**:
- React 18.3.1
- Vite 5.4.20
- TypeScript 5.6.3
- Tailwind CSS 3.4.17
- TanStack Query 5.60.5
- Wouter 3.3.5 (routing)

**Backend**:
- Express 4.21.2
- tsx 4.20.5 (TypeScript execution)

**Database & Infrastructure**:
- Supabase (PostgreSQL)
- Drizzle ORM 0.39.1 (schema definition only)
- Neon Serverless (via Supabase)

**External Services**:
- OpenAI API (Whisper + GPT-4)
- Google Calendar API (OAuth)
- Hunter.io API (optional)
- People Data Labs API (optional)

### Key Directories

```
├── client/src/          # React frontend (77 components)
│   ├── components/     # UI components (shadcn/ui + custom)
│   ├── pages/          # Route-level pages (14 files)
│   ├── hooks/          # Custom React hooks (11 files)
│   ├── contexts/       # React contexts (AuthContext)
│   └── lib/            # Utilities (supabase, queryClient, edgeFunctions)
├── server/             # Express backend (minimal)
│   ├── index.ts       # Server entry point
│   ├── routes.ts       # Route registration
│   └── routes/         # Route handlers (google-auth.ts)
├── shared/             # Shared TypeScript
│   └── schema.ts       # Drizzle ORM schema (15 tables)
├── supabase/
│   ├── migrations/     # SQL migrations (11 files)
│   └── functions/      # Edge Functions (8 functions)
└── docs/              # Documentation (new)
```

### How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on port 5000 (or PORT env var)
# Frontend served via Vite dev server
```

### How to Test

```bash
# Type checking only
npm run check

# Note: No unit/integration/E2E tests configured
```

### How to Build/Deploy

```bash
# Build for production
npm run build
# Outputs: dist/public (client) + dist/index.js (server)

# Run production build
npm start
# Runs: node dist/index.js

# Deploy Edge Functions
supabase functions deploy function-name
```

### Entry Points

- **Client**: `client/src/main.tsx` → `App.tsx`
- **Server**: `server/index.ts`
- **Database Schema**: `shared/schema.ts`
- **Edge Functions**: `supabase/functions/*/index.ts`

### Test Strategy

**Current State**:
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ✅ TypeScript type checking (`npm run check`)

**User Mentioned**: `run_test` tool for Playwright (E2E testing)

### CI/CD

**Current State**:
- ❌ No GitHub Actions workflows (except `.github/workflows/deploy-functions.yml` for Edge Functions)
- ❌ No pre-commit hooks
- ❌ No automated testing

### Infrastructure/Deploy

- **Platform**: Replit (autoscale deployment)
- **Database**: Supabase (managed PostgreSQL)
- **Serverless**: Supabase Edge Functions
- **No Docker/Terraform**: Managed infrastructure

### Configuration

**Environment Variables** (see `docs/INDEX_FOR_AI.md` for full list):
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `PORT`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Edge Functions: `OPENAI_API_KEY`, `HUNTER_API_KEY`, `PDL_API_KEY`

**Secrets Management**:
- Replit Secrets UI (for frontend/backend)
- Supabase Dashboard → Edge Functions → Secrets (for functions)

---

## 2. Gap Analysis Table

| # | Gap | Impact | Evidence | Recommendation | Effort | Risk |
|---|-----|--------|----------|----------------|--------|------|
| 1 | **No README.md** | High | No README file exists | Create comprehensive README with quick start, env vars, troubleshooting | S | Low |
| 2 | **No linting/formatting** | High | No `.eslintrc`, `.prettierrc` files | Add ESLint + Prettier with TypeScript/React config | M | Low |
| 3 | **No test suite** | High | No test files, no test scripts | Add Vitest for unit tests, Playwright for E2E | L | Low |
| 4 | **No pre-commit hooks** | Medium | No Husky/lint-staged setup | Add Husky + lint-staged for pre-commit validation | M | Low |
| 5 | **No CI/CD pipeline** | Medium | No `.github/workflows/ci.yml` | Add GitHub Actions for lint/type/test on PR | M | Low |
| 6 | **No .env.example** | Medium | Env vars scattered, not documented | Create `.env.example` with all required variables | S | Low |
| 7 | **No error boundary** | Medium | React errors crash entire app | Add ErrorBoundary component | S | Low |
| 8 | **No API documentation** | Low | Routes lack JSDoc comments | Add JSDoc to Express routes | S | Low |
| 9 | **No migration guide** | Low | Migration process not documented | Create `docs/MIGRATIONS.md` | S | Low |
| 10 | **No .cursorrules** | High | No repo-specific coding conventions | Create `.cursorrules` with patterns and "do not touch" zones | M | Low |
| 11 | **No AI onboarding docs** | High | No `docs/INDEX_FOR_AI.md` | Create comprehensive AI agent onboarding guide | M | Low |
| 12 | **No architecture docs** | Medium | Architecture not documented | Create `docs/ARCHITECTURE.md` | M | Low |
| 13 | **No flow diagrams** | Medium | System flows not visualized | Create `docs/FLOWS.md` with Mermaid diagrams | M | Low |
| 14 | **No task backlog** | Medium | No structured improvement backlog | Create `tasks/` directory with prioritized tasks | S | Low |
| 15 | **TypeScript check not strict** | Low | `npm run check` exists but could be stricter | Verify strict mode, add `--noEmit` flag | S | Low |

**Priority Legend**: High = Blocks AI productivity, Medium = Improves safety/clarity, Low = Nice to have

---

## 3. Cursor Optimization Plan

### Phase 1: Quick Wins (Same Day) ✅ COMPLETED

**Goal**: Create foundational documentation and rules for AI agents.

**Completed Tasks**:
1. ✅ Created `.cursorrules` - Repo-specific coding conventions
2. ✅ Created `docs/INDEX_FOR_AI.md` - AI agent onboarding guide
3. ✅ Created `docs/ARCHITECTURE.md` - System architecture overview
4. ✅ Created `docs/FLOWS.md` - Mermaid flow diagrams
5. ✅ Created `README.md` - Quick start guide
6. ✅ Created `tasks/README.md` - Prioritized task backlog

**Impact**: AI agents can now understand the codebase structure, conventions, and flows immediately.

**Time Spent**: ~2 hours

---

### Phase 2: Hardening (1-3 Days)

**Goal**: Add safety mechanisms (linting, testing, CI) to prevent regressions.

**Tasks**:
1. **Add ESLint + Prettier** (2-3 hours)
   - Configure ESLint for TypeScript + React
   - Configure Prettier with 2-space indent
   - Add `npm run lint` and `npm run format` scripts
   - Fix critical linting issues

2. **Add Pre-commit Hooks** (1-2 hours)
   - Install Husky + lint-staged
   - Run linting/formatting on staged files
   - Block commits with errors

3. **Add Minimal Smoke Test** (2-3 hours)
   - Install Vitest
   - Create `tests/smoke.test.ts`
   - Test app initialization and basic routes
   - Add `npm test` script

4. **Add GitHub Actions CI** (1-2 hours)
   - Create `.github/workflows/ci.yml`
   - Run lint, type check, and tests on PR
   - Fail on errors

5. **Create .env.example** (30 minutes)
   - Document all required environment variables
   - Add comments explaining each variable
   - Reference in README

**Total Effort**: 6-10 hours  
**Risk**: Low (all are additive, non-breaking)

---

### Phase 3: Deeper Improvements (Later)

**Goal**: Improve test coverage, error handling, and developer experience.

**Tasks**:
1. **Add Error Boundary** (1 hour)
   - Create `ErrorBoundary.tsx` component
   - Wrap app in ErrorBoundary
   - Display user-friendly error messages

2. **Expand Test Suite** (8-16 hours)
   - Add unit tests for hooks (`useContacts`, `useConversations`)
   - Add integration tests for Edge Functions
   - Add E2E tests with Playwright (user mentioned `run_test` tool)
   - Target: 60%+ coverage for critical paths

3. **Add API Documentation** (2 hours)
   - Add JSDoc comments to Express routes
   - Document request/response formats
   - Document auth requirements

4. **Create Migration Guide** (1 hour)
   - Document migration creation process
   - Document rollback procedures
   - Add best practices

5. **Add TypeScript Strict Checks** (1 hour)
   - Verify `strict: true` in tsconfig.json
   - Add `--noEmit` to check script
   - Fix any existing type errors

**Total Effort**: 13-21 hours  
**Risk**: Low-Medium (may reveal existing issues)

---

## 4. Proposed File Changes

### New Files Created ✅

1. **`.cursorrules`**
   - Repo-specific coding conventions
   - "Do not touch" zones (security, schema, migrations)
   - Preferred patterns (pages, hooks, Edge Functions)
   - Common pitfalls and solutions

2. **`docs/INDEX_FOR_AI.md`**
   - AI agent onboarding guide
   - Quick start commands
   - Architecture overview
   - Key flows (auth, CRUD, AI operations)
   - Configuration guide
   - Troubleshooting section

3. **`docs/ARCHITECTURE.md`**
   - System architecture overview
   - Technology stack details
   - Component architecture
   - Data flow patterns
   - Dependency boundaries
   - Security architecture
   - Performance considerations

4. **`docs/FLOWS.md`**
   - Mermaid diagrams for:
     - Main runtime flow
     - Authentication flow
     - Conversation recording flow
     - Data persistence flow
     - External integrations flow
     - User journey (making introductions)
     - Contact management flow
     - Google Calendar sync flow
     - Match generation flow
     - Security flow (ownership validation)

5. **`README.md`**
   - Project overview
   - Quick start instructions
   - Environment variables list
   - Project structure
   - Tech stack
   - Key features
   - Development workflow
   - Troubleshooting

6. **`tasks/README.md`**
   - Top 10 prioritized tasks
   - Each task includes:
     - Context and goal
     - Files impacted
     - Acceptance criteria
     - Test plan
     - Risk notes

### Files to Create (Phase 2)

1. **`.eslintrc.json`** - ESLint configuration
2. **`.prettierrc`** - Prettier configuration
3. **`.prettierignore`** - Prettier ignore patterns
4. **`.env.example`** - Environment variable template
5. **`.github/workflows/ci.yml`** - CI workflow
6. **`.husky/pre-commit`** - Pre-commit hook
7. **`.lintstagedrc`** - lint-staged configuration
8. **`tests/smoke.test.ts`** - Minimal smoke test
9. **`client/src/components/ErrorBoundary.tsx`** - Error boundary component
10. **`docs/MIGRATIONS.md`** - Migration guide

### Files to Modify (Phase 2)

1. **`package.json`**
   - Add `lint` script
   - Add `format` script
   - Add `test` script
   - Add devDependencies: `eslint`, `prettier`, `vitest`, `husky`, `lint-staged`

2. **`client/src/App.tsx`**
   - Wrap app with `<ErrorBoundary>`

3. **`tsconfig.json`**
   - Verify `strict: true`
   - Add `--noEmit` to check script (if needed)

---

## 5. Task Backlog Summary

**Top 10 Priority Tasks** (see `tasks/README.md` for details):

1. ✅ **Add README.md** - COMPLETED
2. **Add ESLint + Prettier** - Phase 2
3. **Add TypeScript Strict Checking** - Phase 2
4. **Create Minimal Smoke Test** - Phase 2
5. **Add Pre-commit Hooks** - Phase 2
6. **Document Environment Variables** - Phase 2
7. **Add GitHub Actions CI** - Phase 2
8. **Add Error Boundary** - Phase 3
9. **Add API Route Documentation** - Phase 3
10. **Add Database Migration Guide** - Phase 3

**Status**: 1/10 completed (Phase 1), 6/10 planned (Phase 2), 3/10 planned (Phase 3)

---

## 6. Mermaid Diagrams

All flow diagrams are in `docs/FLOWS.md`. Summary:

1. **Main Runtime Flow** - User journey from login to recording
2. **Authentication Flow** - Supabase Auth sequence
3. **Conversation Recording Flow** - Audio capture → transcription → matching
4. **Data Persistence Flow** - CRUD operations with RLS
5. **External Integrations Flow** - Google Calendar, contact enrichment, AI
6. **User Journey: Making an Introduction** - Match → email generation → double opt-in
7. **Contact Management Flow** - CRUD operations for contacts
8. **Google Calendar Sync Flow** - OAuth → token storage → event sync
9. **Match Generation Flow** - Entity extraction → contact scoring
10. **Security Flow: Ownership Validation** - JWT verification → RLS check

---

## 7. Immediate Next Steps

### For AI Agents

1. **Read `docs/INDEX_FOR_AI.md`** - Start here for onboarding
2. **Review `.cursorrules`** - Understand coding conventions
3. **Check `docs/ARCHITECTURE.md`** - Understand system design
4. **Review `docs/FLOWS.md`** - Visualize key flows

### For Developers

1. **Review `README.md`** - Quick start guide
2. **Check `tasks/README.md`** - See prioritized improvements
3. **Start Phase 2 tasks** - Add linting, testing, CI

### For Project Maintainers

1. **Review Gap Analysis** - Prioritize remaining improvements
2. **Implement Phase 2** - Add safety mechanisms
3. **Plan Phase 3** - Expand test coverage

---

## 8. Success Metrics

**Phase 1 (Completed)**:
- ✅ AI agents can understand codebase structure
- ✅ Coding conventions documented
- ✅ System flows visualized
- ✅ Onboarding guide created

**Phase 2 (Target)**:
- [ ] All code passes linting
- [ ] Pre-commit hooks prevent broken commits
- [ ] CI pipeline catches errors before merge
- [ ] Smoke test verifies app starts

**Phase 3 (Target)**:
- [ ] 60%+ test coverage for critical paths
- [ ] Error boundary catches React errors
- [ ] All API routes documented
- [ ] Migration process documented

---

## Conclusion

The codebase is now **Cursor-optimized** for Phase 1 (documentation and conventions). AI agents can:
- ✅ Understand architecture quickly (via `docs/INDEX_FOR_AI.md`)
- ✅ Follow consistent conventions (via `.cursorrules`)
- ✅ Visualize system flows (via `docs/FLOWS.md`)
- ✅ Plan work as tasks (via `tasks/README.md`)

**Remaining work** (Phases 2-3) focuses on safety mechanisms (linting, testing, CI) and deeper improvements (error handling, expanded tests).

**Risk Assessment**: All changes are **low-risk** and **additive**. No breaking changes to existing functionality.

---

**Analysis Complete** ✅

