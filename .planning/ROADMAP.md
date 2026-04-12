# Roadmap — Mind-Sync

---

## Milestone 1: Codebase Improvement ✅ COMPLETE

**5 phases** | **20 requirements** | Completed 2026-04-07

| # | Phase | Status |
|---|-------|--------|
| 1 | Fix Data Integrity Gaps — mutations persist to DB | ✅ Done |
| 2 | Split Monolithic Store — domain-based Zustand slices | ✅ Done |
| 3 | Resolve ESLint Suppressions — zero lint warnings | ✅ Done |
| 4 | Clean Up Stale Files — no artifacts in repo | ✅ Done |
| 5 | Add Critical Test Coverage — 109 tests passing | ✅ Done |

---

## Milestone 2: Performance & Reliability ✅ COMPLETE

**5 phases** | **18 requirements** | Completed 2026-04-09

### Phase 1: Batch Database Operations
**Goal:** Eliminate sequential DB loops — all bulk operations use batch inserts.
**Requirements:** PERF-01, PERF-02, PERF-03
**Depends on:** None

**What to do:**
- Refactor `bulkImportTasks` in `src/actions/tasks.ts` to use `db.insert().values([...])` batch insert instead of sequential `for` loop
- Refactor `cloneTaskToDb` subtask creation to batch-insert child tasks
- Refactor `syncGoogleCalendar` in `src/actions/events.ts` to collect inserts/updates and execute in batches instead of per-event DB calls
- Add rate limit entry cleanup: scheduled deletion of expired `rateLimits` rows (via a server action or cron endpoint)

**Success criteria:**
1. `bulkImportTasks` with 50 tasks completes in <2s (vs current sequential ~10s)
2. Google Calendar sync with 50 events does ≤3 DB round-trips (vs current 50+)
3. Expired rate limit entries are cleaned up automatically

---

### Phase 2: Bundle Size Optimization
**Goal:** Reduce initial JS bundle by lazy-loading heavy dependencies.
**Requirements:** PERF-04, PERF-05, PERF-06
**Depends on:** None (can run in parallel with Phase 1)

**What to do:**
- Lazy-load Three.js + @react-three/fiber + @react-three/drei in `Hero3D.tsx` using `next/dynamic` with `ssr: false`
- Lazy-load Tiptap editor in notes pages (only load when user opens a note)
- Lazy-load Recharts in analytics/dashboard (only load when charts are visible)
- Audit bundle with `@next/bundle-analyzer` and document baseline vs optimized sizes
- Reduce Sentry `tracesSampleRate` from `1.0` to `0.1` in production (keep 1.0 in dev)

**Success criteria:**
1. Landing page JS bundle reduced by ≥30%
2. Three.js chunk only loads on the landing page
3. Tiptap chunk only loads on `/notes/[id]`
4. Sentry traces sampled at 10% in production

---

### Phase 3: Smart Store Persistence
**Goal:** Prevent localStorage bloat and reduce serialization overhead.
**Requirements:** PERF-07, PERF-08, PERF-09
**Depends on:** Phase 1 (batch operations must work first)

**What to do:**
- Add `partialize` to Zustand persist config — only persist essential state (timer settings, view preferences, columns), NOT full task/event/note arrays
- Remove tasks, events, and notes from localStorage — rely on server-fetched data + StoreHydrator
- Add `version` field to persist config with migration function for future schema changes
- Benchmark: measure time for `JSON.stringify` of full store vs partialized store

**Success criteria:**
1. localStorage usage reduced by ≥80% (tasks/events/notes no longer stored)
2. Page load with 500+ tasks shows no jank from deserialization
3. Timer settings, column config, and view preferences survive page refresh
4. Fresh page load still hydrates correctly from server data

---

### Phase 4: Accessibility & SEO Hardening
**Goal:** Fix accessibility violations and optimize for search engines.
**Requirements:** ACC-01, ACC-02, ACC-03, ACC-04
**Depends on:** None

**What to do:**
- Remove `userScalable: false` from viewport meta — allow pinch-to-zoom
- Add `aria-label` attributes to all icon-only buttons (sidebar, kanban column actions)
- Add keyboard navigation to Kanban board (arrow keys to move between columns/cards)
- Add `<meta>` descriptions and OpenGraph tags to the landing page for SEO
- Add `robots.txt` and `sitemap.xml` generation via Next.js metadata API
- Verify color contrast ratios meet WCAG 2.1 AA in dark mode

**Success criteria:**
1. Lighthouse Accessibility score ≥90
2. All interactive elements reachable via keyboard
3. No `userScalable: false` in viewport config
4. Landing page has valid OpenGraph and Twitter card meta tags

---

### Phase 5: Expand Test Coverage
**Goal:** Custom hooks and E2E flows have test coverage.
**Requirements:** TEST-05, TEST-06, TEST-07, TEST-08
**Depends on:** Phase 3 (store persistence changes affect hook behavior)

**What to do:**
- Add unit tests for critical custom hooks:
  - `useBrowserSpeechRecognition` — test recognition lifecycle
  - `useVirtualList` — test scroll position and item measurement
  - `useHydrated` — test SSR vs client state
  - `useSoundscapes` — test audio context management
- Add E2E tests with Playwright:
  - Task CRUD flow (create → edit → toggle → delete)
  - Calendar event creation and Google sync flow
  - Note creation with rich text editor
  - Kanban drag-and-drop column reorder
- Set up CI coverage reporting (Vitest `--coverage` in GitHub Actions)

**Success criteria:**
1. Custom hook test coverage ≥70%
2. 4+ E2E test scenarios passing in Playwright
3. CI pipeline runs tests on every PR
4. Total test count ≥150

---

## Phase Summary

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Batch Database Operations | Eliminate sequential loops | PERF-01 → PERF-03 | ✅ Done |
| 2 | Bundle Size Optimization | Lazy-load heavy deps | PERF-04 → PERF-06 | ✅ Done |
| 3 | Smart Store Persistence | Reduce localStorage bloat | PERF-07 → PERF-09 | ✅ Done |
| 4 | Accessibility & SEO Hardening | WCAG AA, OpenGraph | ACC-01 → ACC-04 | ✅ Done |
| 5 | Expand Test Coverage | Hooks + E2E tests | TEST-05 → TEST-08 | ✅ Done |

---

## Milestone 3: Feature Enhancements ✅ COMPLETE

**5 phases** | **12 requirements** | Completed 2026-04-09

| # | Phase | Goal | Status |
|---|-------|------|--------|
| 1 | Recurring Tasks | RRULE-based task generation with dedup | ✅ Done |
| 2 | AI Daily Briefing | Gemini-powered daily overview on dashboard | ✅ Done |
| 3 | Mobile Kanban | Responsive layout, stacked columns on mobile | ✅ Done |
| 4 | Enhanced PWA | Runtime caching, offline fallback, manifest | ✅ Done |
| 5 | Recurring Task Tests | 21 unit tests for recurring utilities | ✅ Done |

---

## Milestone 4: Infrastructure ✅ COMPLETE

**4 phases** | **8 requirements** | Completed 2026-04-09

| # | Phase | Goal | Status |
|---|-------|------|--------|
| 1 | Connection Pooling | postgres client with max/idle/lifetime settings | ✅ Done |
| 2 | In-Memory Rate Limiting | MemoryRateLimiter class with strategy selection | ✅ Done |
| 3 | Edge Middleware | Request timing, bot detection, observability headers | ✅ Done |
| 4 | Health Check | Enhanced with uptime, memory, latency, no-cache | ✅ Done |

---

## Milestone 5 & 6 (Collaboration & AI)

**8 phases**

### Phase 1: Workspace Abstraction
**Goal:** Transition data ownership from individual users to shared Workspaces.
**Requirements:** COLLAB-01, COLLAB-02
**Depends on:** None
**What to do:**
- Create `workspaces` and `workspace_members` tables in `schema.ts`.
- Add `workspaceId` to `tasks`, `notes`, `events`.
- Update Server Actions to fetch items by `workspaceId` instead of `userId`.
**Success Criteria:**
1. Users can create a workspace and switch between them.
2. Data fetches correctly without bleeding across workspaces.

### Phase 2: PartyKit Real-time Infrastructure
**Goal:** Set up presence channels for active users in a workspace.
**Requirements:** COLLAB-03, COLLAB-04
**Depends on:** Phase 1
**What to do:**
- Install and configure `partykit`.
- Create a presence room based on `workspaceId`.
- Add "live avatar" bubbles across the Kanban board.
**Success Criteria:**
1. Opening the app in two browsers shows both users in the Kanban header.

### Phase 3: Yjs Collaborative Notes
**Goal:** Multiplayer text editing.
**Requirements:** COLLAB-05
**Depends on:** Phase 2
**What to do:**
- Add `yjs`, `y-partykit`, and `@tiptap/extension-collaboration` dependencies.
- Re-configure the Tiptap editor to sync via websocket instead of direct database patches.
- Sync CRDT state to Postgres periodically.
**Success Criteria:**
1. Two users can type in the same note simultaneously without overwriting each other.

### Phase 4: Comments and Threads
**Goal:** Communication layer on tasks and notes.
**Requirements:** COLLAB-06
**Depends on:** Phase 1, Phase 2
**What to do:**
- Add `comments` table with polymorphic references.
- Create UI component `<CommentThread />` attached to Task details and Note margins.
- Broadcast new comments via PartyKit.
**Success Criteria:**
1. Users can leave a comment and it appears instantly for other active users.

### Phase 5: Natural Language Task Creation
**Goal:** Command-K interface for task creation.
**Requirements:** AUTO-01, AUTO-02
**Depends on:** None
**What to do:**
- Build a generic chat-like input bar using Gemini 2.0 Flash in `actions/ai.ts` to parse intent.
- Extract intent JSON (e.g., `{ "action": "CREATE_EVENT", "date": "..." }`).
**Success Criteria:**
1. "Schedule gym for tomorrow at 5pm" creates a valid Google Calendar event.

### Phase 6: AI Auto-categorization
**Goal:** Eliminate manual tagging.
**Requirements:** AUTO-03
**Depends on:** Phase 5
**What to do:**
- Add background AI processing to `createTask` server action for unstructured input.
- Update task priority and tags automatically based on descriptions.
**Success Criteria:**
1. Creating a task called "Fix critical prod bug" automatically assigns `P0` and `bug` tag.

### Phase 7: Smart Conflict Resolution
**Goal:** Protect the calendar using AI intelligence.
**Requirements:** AUTO-04
**Depends on:** Phase 6
**What to do:**
- Expand the `generateSchedule` logic to read existing events array.
- Implement constraint solvers to shift flexible tasks.
**Success Criteria:**
1. Attempting to schedule over a Google Event suggests an alternate slot.

### Phase 8: Weekly Productivity Reports
**Goal:** Email delivery of stats.
**Requirements:** AUTO-05
**Depends on:** None
**What to do:**
- Setup Vercel Cron endpoint pointing to `api/cron/weekly`.
- Calculate streak, tasks completed, time focused using Drizzle queries.
- Connect Resend API or SMTP to mail user.
**Success Criteria:**
1. Triggering cron locally sends a visually formatted HTML summary.

---
*Last updated: 2026-04-10 — Initiating Milestones 5 and 6 execution.*
