# Directory Structure

## Root
```
Mind-Sync/
├── src/                          # Main source code
├── e2e/                          # Playwright E2E tests
├── docs/                         # Documentation
├── public/                       # Static assets, PWA manifest, icons
├── .planning/                    # GSD planning artifacts
├── next.config.ts                # Next.js config (Sentry + PWA)
├── drizzle.config.ts             # Drizzle ORM config
├── tailwind.config.ts            # Tailwind v4 config (shadcn/ui vars)
├── vitest.config.ts              # Unit test config
├── playwright.config.ts          # E2E test config
├── eslint.config.mjs             # ESLint flat config
├── tsconfig.json                 # TypeScript config
├── sentry.client.config.ts       # Sentry client setup
├── package.json                  # Dependencies & scripts
└── .env.example                  # Environment variable template
```

## Source (`src/`)
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── sign-in/              # Clerk sign-in page
│   │   └── sign-up/              # Clerk sign-up page
│   ├── (dashboard)/              # Protected dashboard route group
│   │   ├── DashboardShell.tsx    # Sidebar layout wrapper
│   │   ├── layout.tsx            # Dashboard layout (wraps DashboardShell)
│   │   ├── template.tsx          # Page transition wrapper
│   │   ├── dashboard/            # Main dashboard page
│   │   ├── calendar/             # Calendar page
│   │   ├── notes/                # Notes page (with nested layout)
│   │   ├── kanban/               # Kanban board page
│   │   ├── meeting/              # Meeting mode page
│   │   ├── focus/                # Focus timer page
│   │   ├── habits/               # Habit tracker page
│   │   ├── analytics/            # Analytics/stats page
│   │   └── settings/             # Settings page
│   ├── api/                      # API routes
│   │   ├── auth/google/          # Google OAuth callback
│   │   ├── deepgram/             # Deepgram token endpoint
│   │   └── health/               # Health check endpoint
│   ├── actions/                  # Page-level server actions
│   ├── LandingPage.tsx           # Landing page component
│   ├── layout.tsx                # Root layout (Clerk, Theme, Fonts)
│   ├── page.tsx                  # Root page (renders LandingPage)
│   ├── globals.css               # Global styles + CSS variables
│   ├── global-error.tsx          # Sentry error boundary
│   └── not-found.tsx             # 404 page
│
├── actions/                      # Server Actions (domain-based)
│   ├── index.ts                  # Barrel export
│   ├── shared.ts                 # Auth helpers, user sync
│   ├── tasks.ts                  # Task CRUD + subtasks + bulk
│   ├── events.ts                 # Event CRUD + Google sync
│   ├── notes.ts                  # Note CRUD
│   ├── ai.ts                     # AI actions (summarize, schedule)
│   ├── goals.ts                  # Goal CRUD
│   └── habits.ts                 # Habit CRUD + logs
│
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui primitives (39 components)
│   ├── layout/                   # Layout components (sidebar, header)
│   ├── tasks/                    # Task-specific components
│   ├── kanban/                   # Kanban board components
│   ├── calendar/                 # Calendar components
│   ├── notes/                    # Note components
│   ├── habits/                   # Habit components
│   ├── focus/                    # Focus timer components
│   ├── landing/                  # Landing page components
│   ├── analytics/                # Analytics components
│   ├── mobile/                   # Mobile-specific components
│   ├── providers/                # Context providers (ThemeProvider)
│   ├── pwa/                      # PWA install prompt
│   ├── accessibility/            # Accessibility components
│   ├── StoreHydrator.tsx         # Zustand ← Server data bridge
│   ├── command-palette.tsx       # Global command palette (cmdk)
│   ├── focus-timer.tsx           # Pomodoro timer component
│   ├── kanban-board.tsx          # Main kanban board
│   ├── productivity-dashboard.tsx # Dashboard stats
│   ├── progress-visualization.tsx # Progress charts
│   ├── skeleton-loaders.tsx      # Loading skeletons
│   ├── audio-player.tsx          # Soundscape player
│   └── route-error.tsx           # Route error boundary
│
├── features/                     # Feature modules
│   ├── ai/                       # AI feature logic
│   │   ├── advanced-ai.ts        # Complex AI features
│   │   ├── smart-suggestions.ts  # Smart task suggestions
│   │   └── natural-language.ts   # NLP date parsing
│   ├── tasks/components/         # Task feature components
│   ├── calendar/components/      # Calendar feature components
│   ├── notes/components/         # Notes feature components
│   ├── meeting-mode/components/  # Meeting mode components
│   ├── dashboard/components/     # Dashboard feature components
│   └── templates/components/     # Template feature components
│
├── store/                        # State management
│   ├── useStore.ts               # Main Zustand store (~1100 lines)
│   ├── selectors.ts              # Granular selectors
│   └── __tests__/                # Store tests
│
├── hooks/                        # Custom React hooks
│   ├── use-calendar-sync.ts      # Google Calendar sync hook
│   ├── use-soundscapes.ts        # Ambient sound hook
│   ├── useSpeechRecognition.ts   # Deepgram speech hook
│   ├── useBrowserSpeechRecognition.ts # Browser speech fallback
│   ├── useKeyboardShortcuts.ts   # Global keyboard shortcuts
│   ├── useMemoization.ts         # Perf memoization utilities
│   ├── usePullToRefresh.ts       # Mobile pull-to-refresh
│   ├── useSwipeGesture.ts        # Mobile swipe gestures
│   └── useVirtualList.ts         # Virtual scrolling
│
├── lib/                          # Shared utilities
│   ├── errors.ts                 # Error class hierarchy
│   ├── validation.ts             # Zod schemas
│   ├── sanitize.ts               # Input sanitization
│   ├── logger.ts                 # Structured logging
│   ├── monitoring.ts             # Performance monitoring
│   ├── performance.ts            # Perf utilities
│   ├── rate-limiter.ts           # DB-backed rate limiting
│   ├── data-fetchers.ts          # Cached data fetchers
│   ├── google-calendar.ts        # Google Calendar API client
│   ├── smartReschedule.ts        # AI-powered rescheduling
│   ├── task-utils.ts             # Task helper functions
│   ├── stats-calculator.ts       # Statistics computation
│   ├── export-utils.ts           # Data export helpers
│   ├── export.ts                 # Export logic
│   ├── toast-queue.ts            # Toast notification queue
│   ├── note-templates.ts         # Note templates
│   ├── env.ts                    # Environment validation
│   ├── error-reporting.ts        # Error reporting helpers
│   ├── timezone.ts               # Timezone utilities
│   ├── sounds.ts                 # Sound effects
│   ├── accessibility.ts          # A11y utilities
│   ├── utils.ts                  # General utility (cn, etc.)
│   └── __tests__/                # Lib unit tests
│
├── db/                           # Database
│   ├── index.ts                  # Connection setup
│   ├── schema.ts                 # Drizzle schema (9 tables)
│   └── migrations/               # Migration history
│
├── types/                        # TypeScript types
│   └── index.ts                  # Shared interfaces
│
├── test/                         # Test setup
│   └── setup.ts                  # Vitest globals + test-lib setup
│
├── middleware.ts                  # Clerk auth middleware
└── instrumentation.ts            # Sentry instrumentation
```

## Naming Conventions
- **Files:** kebab-case for utilities/hooks, PascalCase for React components
- **Directories:** kebab-case throughout
- **Route groups:** Parenthesized `(auth)`, `(dashboard)` for layout grouping
- **Tests:** `__tests__/` directories co-located with source, `*.test.{ts,tsx}` naming
- **Feature modules:** `src/features/<name>/components/` pattern
