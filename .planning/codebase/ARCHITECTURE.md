# Architecture

## Pattern
**Next.js App Router + Server Actions + Zustand Client State**

The app uses a hybrid architecture:
1. **Server-side:** Next.js Server Actions for all data mutations (no REST API routes for CRUD)
2. **Client-side:** Zustand store with optimistic updates, localStorage persistence, and server sync
3. **Data flow:** Server Components fetch initial data → hydrate Zustand store → client-side interactions use store → mutations call server actions → optimistic updates with rollback

## Layers

### 1. Presentation Layer (`src/app/`, `src/components/`, `src/features/`)
- **App Router pages** — Route handlers with RSC data fetching
- **Feature modules** — Self-contained feature directories under `src/features/`
- **Shared components** — Reusable UI in `src/components/ui/` (shadcn/ui pattern)
- **Layout system** — `(dashboard)` route group with `DashboardShell.tsx` sidebar

### 2. State Layer (`src/store/`)
- **Zustand store** — Single monolithic store (`useStore.ts`, ~1100 lines)
- **Selectors** — Granular selectors in `selectors.ts` to avoid unnecessary re-renders
- **Persistence** — `zustand/persist` with localStorage
- **Hydration** — `StoreHydrator.tsx` component syncs server data into Zustand on mount

### 3. Action Layer (`src/actions/`)
- **Server Actions** — `"use server"` functions organized by domain:
  - `tasks.ts` — CRUD, toggle, clone, subtask sync, bulk import
  - `events.ts` — CRUD, Google Calendar sync
  - `notes.ts` — CRUD
  - `ai.ts` — Meeting summarization, schedule generation
  - `goals.ts` — Goal CRUD and progress tracking
  - `habits.ts` — Habit CRUD and log management
  - `shared.ts` — Auth helpers, user sync
- **Pattern:** `requireAuth()` → `checkRateLimit()` → validate (Zod) → DB operation → `revalidatePath/Tag`

### 4. Data Layer (`src/db/`)
- **Drizzle ORM** — Schema definitions, connection setup
- **Caching:** `src/lib/data-fetchers.ts` — `unstable_cache` with tag-based revalidation

### 5. Library Layer (`src/lib/`)
- Shared utilities: validation, errors, sanitization, logging, monitoring, performance, timezone, export, sounds, rate-limiter, toast queue, accessibility

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│ Server Comp │────▶│ StoreHydrator│────▶│ Zustand     │────▶│ React UI │
│ (fetch)     │     │ (sync)       │     │ (optimistic)│     │ (render) │
└─────────────┘     └──────────────┘     └──────┬──────┘     └──────────┘
                                                │
                                    User Action │
                                                ▼
                                        ┌──────────────┐
                                        │ Server Action │
                                        │ (validate,   │
                                        │  rate limit,  │
                                        │  DB write)   │
                                        └──────┬───────┘
                                               │
                                  ┌────────────┴────────────┐
                                  │                         │
                                  ▼                         ▼
                          ┌──────────────┐          ┌──────────────┐
                          │ PostgreSQL   │          │ revalidate   │
                          │ (Drizzle)    │          │ Path/Tag     │
                          └──────────────┘          └──────────────┘
```

## Entry Points
- `src/app/page.tsx` — Landing page (unauthenticated)
- `src/app/(dashboard)/layout.tsx` — Dashboard shell (authenticated)
- `src/middleware.ts` — Clerk auth gate
- `src/instrumentation.ts` — Sentry server-side setup

## Key Abstractions
- **`ActionResult<T>`** — Typed success/error result wrapper (`src/lib/errors.ts`)
- **`AppError` hierarchy** — `ValidationError`, `AuthError`, `NotFoundError`, `RateLimitError`, `APIError`
- **Store selectors** — Individual primitive selectors + backward-compatible object selectors
- **Optimistic Updates** — Store mutates immediately, rolls back on server action failure
- **Undo/Redo** — `HistoryEntry` stack in Zustand (max 50 entries)
