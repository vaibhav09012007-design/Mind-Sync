# Roadmap — Codebase Improvement Milestone

## Overview
**5 phases** | **20 requirements** | Sequential execution (shared file dependencies)

## Phases

### Phase 1: Fix Data Integrity Gaps
**Goal:** All store mutations persist to the database — no silent data loss.
**Requirements:** DATA-01, DATA-02, DATA-03
**Depends on:** None

**What to do:**
- Add server action call to `updateTaskPriority` in store (currently local-only)
- Add server action call to `bulkUpdateTasks` in store (currently local-only)
- Audit all other store actions to verify they have matching server sync
- Add rollback on server failure for any actions missing it

**Success criteria:**
1. Changing task priority in the UI persists after page refresh
2. Bulk updating tasks persists after page refresh
3. No store action mutates data without a corresponding server call

---

### Phase 2: Split Monolithic Zustand Store
**Goal:** `useStore.ts` decomposed into domain slices, each under 200 lines.
**Requirements:** STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, STORE-06, STORE-07, STORE-08
**Depends on:** Phase 1 (data integrity fixes need to be in before restructuring)

**What to do:**
- Create `src/store/slices/taskSlice.ts` — task state + actions
- Create `src/store/slices/eventSlice.ts` — event state + actions
- Create `src/store/slices/noteSlice.ts` — note state + actions
- Create `src/store/slices/timerSlice.ts` — timer/pomodoro state + actions
- Create `src/store/slices/kanbanSlice.ts` — columns, view settings, drag state
- Create `src/store/slices/appSlice.ts` — notifications, history, undo/redo, google token
- Rewrite `useStore.ts` to compose slices (~100 lines)
- Verify `selectors.ts` works without changes (backward compatible)

**Success criteria:**
1. `useStore.ts` is under 100 lines
2. Each slice file is under 200 lines
3. All existing selectors work unchanged
4. `npm run build` succeeds with no errors
5. App behaves identically to before

---

### Phase 3: Resolve ESLint Suppressions
**Goal:** Zero `eslint-disable` comments that mask real issues. `lint:strict` passes.
**Requirements:** LINT-01, LINT-02, LINT-03, LINT-04
**Depends on:** Phase 2 (store restructure may resolve some suppressions)

**What to do:**
- Fix 5x `react-hooks/set-state-in-effect` — refactor to avoid setState in useEffect
- Fix 3x `react-hooks/exhaustive-deps` — add missing deps or refactor
- Fix `react-hooks/refs` in `useVirtualList.ts`
- Replace `any` types with proper types where feasible (keep explicit-any for truly dynamic cases)
- Remove stale `@typescript-eslint/no-unused-vars` suppressions
- Run `eslint --max-warnings 0` to verify

**Success criteria:**
1. `npm run lint:strict` passes with 0 warnings
2. No `react-hooks/set-state-in-effect` or `exhaustive-deps` suppressions remain
3. `any` usage reduced by at least 50%
4. App behaves identically to before

---

### Phase 4: Clean Up Stale Files
**Goal:** Repository contains only meaningful files. No artifacts, backups, or dead code.
**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03
**Depends on:** None (can run after Phase 3)

**What to do:**
- Delete `src/app/globals.css.bak`
- Delete `knip_output.txt`, `knip_result.json`, `unused_knip_files.txt`
- Review and resolve commented-out `revalidateTag` calls in subtask actions
- Add these patterns to `.gitignore` to prevent recurrence

**Success criteria:**
1. No `.bak` files in repo
2. No analysis artifact files in repo
3. All `revalidateTag` calls are either active or removed with rationale in commit message

---

### Phase 5: Add Critical Test Coverage
**Goal:** Core server actions have test coverage — the most critical untested code path.
**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04
**Depends on:** Phase 2 (need stable store slices to test)

**What to do:**
- Create `src/actions/__tests__/tasks.test.ts` — test CRUD, toggle, clone, bulk import
- Create `src/actions/__tests__/events.test.ts` — test CRUD, sync
- Create `src/actions/__tests__/notes.test.ts` — test CRUD
- Create `src/store/__tests__/slices.test.ts` — test optimistic update + rollback per slice
- Mock database and auth for isolated testing

**Success criteria:**
1. `npm run test` passes
2. Task server actions have >80% line coverage
3. Event server actions have >80% line coverage
4. Note server actions have >80% line coverage
5. Store slice tests verify optimistic update and rollback behavior

---

## Phase Summary

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Fix Data Integrity Gaps | Mutations persist to DB | DATA-01, DATA-02, DATA-03 | ✅ Done |
| 2 | Split Monolithic Store | Domain-based slices | STORE-01 → STORE-08 | ✅ Done |
| 3 | Resolve ESLint Suppressions | Clean linting | LINT-01 → LINT-04 | Not Started |
| 4 | Clean Up Stale Files | No artifacts in repo | CLEAN-01 → CLEAN-03 | Not Started |
| 5 | Add Critical Test Coverage | Server action tests | TEST-01 → TEST-04 | Not Started |

---
*Last updated: 2026-03-31 after initialization*
