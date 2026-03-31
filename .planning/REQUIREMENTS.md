# Requirements — Codebase Improvement Milestone

## v1 Requirements

### Data Integrity
- [x] **DATA-01**: `updateTaskPriority` persists priority changes to database via server action
- [x] **DATA-02**: `bulkUpdateTasks` persists bulk changes to database via server action
- [x] **DATA-03**: All store optimistic updates have matching server sync calls

### Store Architecture
- [x] **STORE-01**: Task state and actions extracted to dedicated slice (`taskSlice.ts`)
- [x] **STORE-02**: Event state and actions extracted to dedicated slice (`eventSlice.ts`)
- [x] **STORE-03**: Note state and actions extracted to dedicated slice (`noteSlice.ts`)
- [x] **STORE-04**: Timer state and actions extracted to dedicated slice (`timerSlice.ts`)
- [x] **STORE-05**: Kanban state and actions extracted to dedicated slice (`kanbanSlice.ts`)
- [x] **STORE-06**: Notification/history/view state extracted to dedicated slice (`appSlice.ts`)
- [x] **STORE-07**: Main `useStore.ts` composes slices and remains under 100 lines
- [x] **STORE-08**: All existing selectors in `selectors.ts` continue to work without changes

### Code Quality
- [ ] **LINT-01**: All `react-hooks/set-state-in-effect` suppressions resolved properly
- [ ] **LINT-02**: All `react-hooks/exhaustive-deps` suppressions resolved properly
- [ ] **LINT-03**: `@typescript-eslint/no-explicit-any` reduced (proper types where feasible)
- [ ] **LINT-04**: `eslint --max-warnings 0` passes with zero warnings

### Cleanup
- [ ] **CLEAN-01**: `src/app/globals.css.bak` removed
- [ ] **CLEAN-02**: `knip_output.txt`, `knip_result.json`, `unused_knip_files.txt` removed
- [ ] **CLEAN-03**: Commented-out `revalidateTag` calls either restored or removed with rationale

### Testing
- [ ] **TEST-01**: Server actions for tasks (`src/actions/tasks.ts`) have unit tests
- [ ] **TEST-02**: Server actions for events (`src/actions/events.ts`) have unit tests
- [ ] **TEST-03**: Server actions for notes (`src/actions/notes.ts`) have unit tests
- [ ] **TEST-04**: Store slices have unit tests verifying optimistic update + rollback behavior

## v2 Requirements (Deferred)
- [ ] Server actions for AI, goals, habits tested
- [ ] Custom hooks test coverage
- [ ] E2E test coverage expansion
- [ ] Bundle size optimization (lazy load Three.js)
- [ ] Rate limit cleanup job

## Out of Scope
- New user-facing features — improvement milestone only
- Database schema changes — no migrations
- Dependency version bumps — separate milestone
- UI redesign — out of scope

## Traceability

| Requirement | Phase |
|-------------|-------|
| DATA-01, DATA-02, DATA-03 | Phase 1 |
| STORE-01 through STORE-08 | Phase 2 |
| LINT-01 through LINT-04 | Phase 3 |
| CLEAN-01 through CLEAN-03 | Phase 4 |
| TEST-01 through TEST-04 | Phase 5 |

---
*Last updated: 2026-03-31 after initialization*
