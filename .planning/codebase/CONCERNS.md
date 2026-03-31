# Concerns & Technical Debt

## Code Quality Issues

### ESLint Suppressions (34 instances)
There are **34 `eslint-disable` comments** across the codebase:

| Pattern | Count | Files |
|---------|-------|-------|
| `@typescript-eslint/no-explicit-any` | ~20 | Store, hooks, features, components |
| `react-hooks/set-state-in-effect` | 5 | EditEventDialog, QuickAddPopover, edit-task-dialog, settings, notes layout |
| `react-hooks/exhaustive-deps` | 3 | AudioVisualizer, meeting page, calendar page |
| `@typescript-eslint/no-unused-vars` | 3 | AudioVisualizer, WeekView, PriorityBadge test |
| `react-hooks/refs` | 1 | useVirtualList |

**Most concerning:** The `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` suppressions may mask actual bugs (stale closures, infinite loops, or missing dependency updates).

### Monolithic Zustand Store
- `src/store/useStore.ts` is **~1,100 lines** — a single file containing all state, types, and actions
- Contains inline server action calls (async in store actions creating coupling)
- Types are defined inline rather than imported from `src/types/`
- Dual type definitions: `src/types/index.ts` has simplified types, store has full types — potential mismatch

### Stale/Backup Files
- `src/app/globals.css.bak` — Backup CSS file left in source
- `knip_output.txt` / `knip_result.json` / `unused_knip_files.txt` — Analysis artifacts committed to repo

## Architecture Concerns

### Optimistic Update Rollback Gaps
- `updateTaskPriority` does optimistic update but **does not call a server action** — priority change is local-only
- `bulkUpdateTasks` does optimistic update but **does not sync to server** — only toast shown
- Some rollback blocks duplicate code (e.g., `updateTask` has rollback in both the `if (!result.success)` and `catch` blocks)

### Server Action Rate Limiting
- Rate limits are stored in PostgreSQL (`rateLimits` table) — every rate-limited action adds 1-2 extra DB queries
- No cleanup job for expired rate limit entries (only `expiresAt` index exists)
- Heavy operations like `bulkImportTasks` insert sequentially in a loop rather than batch insert

### Cache Revalidation
- `revalidateTag()` called with second argument `"default"` — this is a non-standard usage pattern
- Multiple `revalidatePath` + `revalidateTag` calls per action (could be consolidated)
- Some subtask actions have commented-out `revalidateTag` calls: `// revalidateTag(CACHE_TAGS.tasks(userId));`

## Security

### Positive
- ✅ CSP headers configured in `next.config.ts`
- ✅ X-Frame-Options, X-XSS-Protection, HSTS headers
- ✅ Clerk middleware protects sensitive routes
- ✅ Server actions use `requireAuth()` consistently
- ✅ Zod validation on inputs
- ✅ Rate limiting on all mutations
- ✅ Input sanitization library (`src/lib/sanitize.ts`)

### Concerns
- `.env.local` exists in the repo root (should be in `.gitignore` — verify it is)
- `userScalable: false` in viewport meta — poor accessibility practice
- Sentry `tracesSampleRate: 1` in client config — 100% tracing may impact performance in production
- Microphone permission granted to `self` in Permissions-Policy — expected for meeting mode but worth noting

## Performance

### Potential Issues
- **3D Dependencies:** Three.js + @react-three/fiber + @react-three/drei add significant bundle weight
- **Monolithic store:** All state in one Zustand store means all subscribers re-evaluate on any change (mitigated by selectors but fragile)
- **Sequential DB operations:** `bulkImportTasks` and `cloneTaskToDb` (subtask creation) use sequential `for` loops instead of batch inserts
- **localStorage persistence:** Entire store serialized to localStorage on every change — large task lists could cause jank
- **No ISR/SSG:** All pages appear to be dynamically rendered — no static optimization

### Positive
- Virtual list hook (`useVirtualList.ts`) for long lists
- Memoization hook (`useMemoization.ts`) for expensive computations
- Granular Zustand selectors to limit re-renders
- Cached data fetchers with `unstable_cache`
- Performance monitoring utilities (`src/lib/performance.ts`, `src/lib/monitoring.ts`)

## Test Coverage Gaps
- **Server actions** have zero test coverage — critical business logic untested
- **Custom hooks** (9 hooks) have no tests
- **AI features** untested
- **Only 1 E2E spec file** — minimal E2E coverage
- **No integration tests** for database operations or API routes

## Dependencies
- React 19.2.3 and Next.js 16.1.1 — bleeding edge versions, may have undocumented breaking changes
- `@sentry/nextjs` 10.x — major version, API differences from v7/v8
- Zod 4.x — major version upgrade from widely-used v3, different API surface
- `uuid` package used alongside `crypto.randomUUID()` which is available natively

## Technical Debt Prioritization

### High Priority
1. **Split Zustand store** — Extract slices by domain (tasks, events, notes, timer, kanban)
2. **Fix optimistic update gaps** — `updateTaskPriority` and `bulkUpdateTasks` missing server sync
3. **Add server action tests** — Critical business logic has zero coverage

### Medium Priority
4. **Resolve eslint-disable suppressions** — Especially `react-hooks/set-state-in-effect` and `exhaustive-deps`
5. **Batch DB operations** — Replace sequential loops with batch inserts
6. **Clean up stale files** — Remove `.css.bak`, knip artifacts

### Low Priority
7. **Type consolidation** — Merge `src/types/` and store inline types
8. **Bundle optimization** — Lazy load Three.js, analyze bundle size
9. **Rate limit cleanup** — Add job to clean expired entries
