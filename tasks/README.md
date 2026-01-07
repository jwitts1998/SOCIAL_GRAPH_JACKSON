# Task Backlog

This directory contains prioritized tasks for improving the codebase's Cursor optimization.

## Top 10 Priority Tasks

### 1. Add README.md with Quick Start Guide
**Status**: Pending  
**Priority**: High  
**Effort**: Small  
**Risk**: Low

**Context**: No README exists, making onboarding difficult for new developers/AI agents.

**Goal**: Create a comprehensive README with:
- Project overview
- Quick start instructions
- Environment setup
- Development workflow
- Deployment instructions

**Files Impacted**:
- `README.md` (new)

**Acceptance Criteria**:
- [ ] README includes project description
- [ ] README includes `npm install` and `npm run dev` instructions
- [ ] README lists all required environment variables (names only, no secrets)
- [ ] README includes links to detailed docs
- [ ] README includes troubleshooting section

**Test Plan**: Manual review, verify all commands work

**Risk Notes**: None - documentation only

---

### 2. Add ESLint + Prettier Configuration
**Status**: Pending  
**Priority**: High  
**Effort**: Medium  
**Risk**: Low

**Context**: No linting/formatting configured, leading to inconsistent code style.

**Goal**: Add ESLint and Prettier with sensible defaults for TypeScript/React.

**Files Impacted**:
- `.eslintrc.json` (new)
- `.prettierrc` (new)
- `.prettierignore` (new)
- `package.json` (add scripts)

**Acceptance Criteria**:
- [ ] ESLint configured for TypeScript + React
- [ ] Prettier configured with 2-space indent, single quotes
- [ ] `npm run lint` command works
- [ ] `npm run format` command works
- [ ] CI-ready (can add to GitHub Actions later)

**Test Plan**: Run `npm run lint` on existing codebase, fix critical issues

**Risk Notes**: May require fixing existing code style issues. Use `--fix` flag initially.

---

### 3. Add TypeScript Strict Type Checking Script
**Status**: Pending  
**Priority**: Medium  
**Effort**: Small  
**Risk**: Low

**Context**: `npm run check` exists but could be more explicit about strict checking.

**Goal**: Ensure TypeScript checking is comprehensive and fails on errors.

**Files Impacted**:
- `package.json` (update `check` script)
- `tsconfig.json` (verify strict settings)

**Acceptance Criteria**:
- [ ] `npm run check` runs `tsc --noEmit --strict`
- [ ] Script fails on type errors (for CI)
- [ ] All existing code passes type check

**Test Plan**: Run `npm run check`, fix any type errors

**Risk Notes**: May reveal existing type issues. Fix incrementally.

---

### 4. Create Minimal Smoke Test
**Status**: Pending  
**Priority**: Medium  
**Effort**: Medium  
**Risk**: Low

**Context**: No tests exist, making it risky to refactor or add features.

**Goal**: Add a minimal smoke test that verifies app starts and basic routes work.

**Files Impacted**:
- `tests/smoke.test.ts` (new)
- `package.json` (add test script, vitest dependency)

**Acceptance Criteria**:
- [ ] Test verifies app starts without errors
- [ ] Test verifies Supabase client initializes
- [ ] Test verifies main routes render (no auth required)
- [ ] `npm test` command works

**Test Plan**: Run `npm test`, verify it passes

**Risk Notes**: May require mocking Supabase client. Use minimal mocks.

---

### 5. Add Pre-commit Hooks (Husky + lint-staged)
**Status**: Pending  
**Priority**: Medium  
**Effort**: Medium  
**Risk**: Low

**Context**: No pre-commit validation, allowing broken code to be committed.

**Goal**: Add Husky + lint-staged to run linting/formatting before commits.

**Files Impacted**:
- `.husky/pre-commit` (new)
- `package.json` (add husky, lint-staged)
- `.lintstagedrc` (new)

**Acceptance Criteria**:
- [ ] Pre-commit runs ESLint on staged files
- [ ] Pre-commit runs Prettier on staged files
- [ ] Pre-commit runs TypeScript check
- [ ] Commit blocked if checks fail

**Test Plan**: Make a commit with linting errors, verify it's blocked

**Risk Notes**: May slow down commits initially. Can be bypassed with `--no-verify` if needed.

---

### 6. Document Environment Variables
**Status**: Pending  
**Priority**: Medium  
**Effort**: Small  
**Risk**: Low

**Context**: Environment variables are scattered, not documented in one place.

**Goal**: Create `.env.example` file documenting all required variables.

**Files Impacted**:
- `.env.example` (new)
- `docs/INDEX_FOR_AI.md` (already documented, verify completeness)

**Acceptance Criteria**:
- [ ] `.env.example` lists all required variables
- [ ] Each variable has a comment explaining purpose
- [ ] No actual secrets in file
- [ ] README references `.env.example`

**Test Plan**: Manual review, verify all variables from codebase are listed

**Risk Notes**: None - documentation only

---

### 7. Add GitHub Actions CI Workflow
**Status**: Pending  
**Priority**: Medium  
**Effort**: Medium  
**Risk**: Low

**Context**: No CI/CD pipeline, making it hard to catch errors before merge.

**Goal**: Add GitHub Actions workflow for linting, type checking, and tests.

**Files Impacted**:
- `.github/workflows/ci.yml` (new)

**Acceptance Criteria**:
- [ ] Workflow runs on PR and push to main
- [ ] Runs `npm install`
- [ ] Runs `npm run lint`
- [ ] Runs `npm run check`
- [ ] Runs `npm test` (when tests exist)
- [ ] Fails if any step fails

**Test Plan**: Create a PR, verify workflow runs

**Risk Notes**: May require fixing existing lint/type errors. Do incrementally.

---

### 8. Add Error Boundary Component
**Status**: Pending  
**Priority**: Low  
**Effort**: Small  
**Risk**: Low

**Context**: No error boundaries, React errors crash entire app.

**Goal**: Add React error boundary to catch and display errors gracefully.

**Files Impacted**:
- `client/src/components/ErrorBoundary.tsx` (new)
- `client/src/App.tsx` (wrap app with ErrorBoundary)

**Acceptance Criteria**:
- [ ] ErrorBoundary catches React errors
- [ ] Displays user-friendly error message
- [ ] Provides "Reload" button
- [ ] Logs errors to console (or error tracking service)

**Test Plan**: Intentionally throw error in component, verify boundary catches it

**Risk Notes**: None - defensive coding

---

### 9. Add API Route Documentation
**Status**: Pending  
**Priority**: Low  
**Effort**: Small  
**Risk**: Low

**Context**: Express routes are minimal but not documented.

**Goal**: Add JSDoc comments to API routes explaining purpose and auth requirements.

**Files Impacted**:
- `server/routes/google-auth.ts` (add JSDoc)
- `server/routes.ts` (add JSDoc)

**Acceptance Criteria**:
- [ ] Each route has JSDoc comment
- [ ] Documents auth requirements
- [ ] Documents request/response formats
- [ ] Documents error cases

**Test Plan**: Manual review

**Risk Notes**: None - documentation only

---

### 10. Add Database Migration Guide
**Status**: Pending  
**Priority**: Low  
**Effort**: Small  
**Risk**: Low

**Context**: Migration process exists but not well-documented for new developers.

**Goal**: Create guide for creating and applying migrations.

**Files Impacted**:
- `docs/MIGRATIONS.md` (new)

**Acceptance Criteria**:
- [ ] Explains how to create new migration
- [ ] Explains how to apply migrations
- [ ] Documents rollback process
- [ ] Includes best practices (never modify existing migrations)

**Test Plan**: Manual review

**Risk Notes**: None - documentation only

---

## Task Status Legend

- **Pending**: Not started
- **In Progress**: Currently being worked on
- **Completed**: Finished and verified
- **Blocked**: Waiting on dependencies
- **Cancelled**: No longer needed

## How to Use This Backlog

1. **Pick a task**: Start with highest priority (lowest number)
2. **Create a branch**: `git checkout -b task/1-add-readme`
3. **Implement**: Follow acceptance criteria
4. **Test**: Verify test plan
5. **Update status**: Mark task as "In Progress" then "Completed"
6. **Create PR**: Link PR to task number

## Adding New Tasks

When adding new tasks:
1. Follow the template above
2. Assign priority (High/Medium/Low)
3. Estimate effort (Small/Medium/Large)
4. Assess risk (Low/Med/High)
5. Include acceptance criteria
6. Add to appropriate priority level

