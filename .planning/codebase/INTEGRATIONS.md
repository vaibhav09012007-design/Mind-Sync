# External Integrations

## Authentication — Clerk
- **Package:** `@clerk/nextjs` 6.x
- **Setup:** `ClerkProvider` wraps root layout (`src/app/layout.tsx`)
- **Middleware:** `src/middleware.ts` — protects `/dashboard`, `/calendar`, `/notes`, `/meeting`, `/settings`
- **Auth Check:** `requireAuth()` in `src/actions/shared.ts` — extracts userId from Clerk session
- **User Sync:** `ensureUserExists()` — upserts Clerk user to `users` table on first action
- **Env Vars:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Error Handling:** Middleware returns 500 if `CLERK_SECRET_KEY` missing (prevents redirect loops)

## Database — PostgreSQL (Drizzle ORM)
- **Connection:** `src/db/index.ts` — `postgres` driver with `prepare: false`
- **Schema:** `src/db/schema.ts` — 9 tables:
  - `users` — Clerk user sync, preferences, Google refresh token
  - `tasks` — With subtasks (parentId), dependencies (dependsOn), recurrence, tags, time tracking
  - `events` — Google Calendar sync, recurring events
  - `notes` — Tiptap JSON content, AI summaries, sentiment, action items, meeting links
  - `attachments` — For tasks and notes (image/file/link)
  - `taskTemplates` — Reusable task templates
  - `recurringTaskInstances` — Instance tracking for recurring tasks
  - `goals` — Productivity goals (hours/tasks/streak metrics)
  - `rateLimits` — Distributed rate limiting table
  - `habits` / `habitLogs` — Habit tracking with streak management
- **Enums:** `status`, `priority`, `attachment_type`, `goal_metric`, `goal_period`, `goal_status`, `habit_frequency`, `habit_time_of_day`, `event_type`
- **Indexes:** Composite indexes on userId + status/dueDate/priority/createdAt for query performance
- **Migrations:** `drizzle-kit push` (schema push, no SQL migration files)

## AI — Google Gemini
- **Package:** `@google/generative-ai`
- **Features:**
  - `src/features/ai/advanced-ai.ts` — Advanced AI features (15KB)
  - `src/features/ai/smart-suggestions.ts` — Smart task/schedule suggestions (9KB)
  - `src/features/ai/natural-language.ts` — NLP date parsing via chrono-node
  - `src/actions/ai.ts` — Server actions: `summarizeMeeting`, `generateSchedule`
- **Env Var:** `GEMINI_API_KEY`

## Speech Recognition — Deepgram
- **Package:** `@deepgram/sdk`
- **API Route:** `src/app/api/deepgram/route.ts`
- **Hooks:**
  - `src/hooks/useSpeechRecognition.ts` — Deepgram WebSocket-based recognition
  - `src/hooks/useBrowserSpeechRecognition.ts` — Browser fallback (Web Speech API)
- **Env Var:** `DEEPGRAM_API_KEY`

## Google Calendar
- **Integration:** `src/lib/google-calendar.ts` (12KB)
- **OAuth Flow:** `src/app/api/auth/google/callback/` route
- **Server Action:** `syncGoogleCalendar` in `src/actions/events.ts`
- **Storage:** Google refresh token stored in `users.googleRefreshToken`
- **Env Vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## Error Tracking — Sentry
- **Package:** `@sentry/nextjs` 10.x
- **Client Config:** `sentry.client.config.ts` — Replay integration, 10% session sampling
- **Next Config:** `next.config.ts` — `tunnelRoute: "/monitoring"` (ad-blocker bypass)
- **Instrumentation:** `src/instrumentation.ts`
- **Error Boundary:** `src/app/global-error.tsx`
- **Env Var:** `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

## PWA
- **Package:** `@ducanh2912/next-pwa`
- **Config:** Production only (`disable: process.env.NODE_ENV === "development"`)
- **Features:** Aggressive front-end nav caching, reload on online
- **Manifest:** `public/manifest.json`
- **Component:** `src/components/pwa/` — PWA install prompt

## Rate Limiting
- **Implementation:** `src/lib/rate-limiter.ts` — Database-backed rate limiting
- **Storage:** `rateLimits` table (distributed across serverless instances)
- **Applied:** All server actions with varying limits (5-100 req/min depending on action)
