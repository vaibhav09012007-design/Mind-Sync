# Technology Stack

## Runtime & Language
- **Language:** TypeScript 5.x (strict mode)
- **Runtime:** Node.js 20 (`.nvmrc`)
- **Framework:** Next.js 16.1.1 (App Router)
- **React:** 19.2.3

## Build & Configuration
- **Build:** `next build --webpack` (explicit webpack bundler)
- **Dev Server:** `next dev` on port 3000
- **Module Resolution:** `bundler` (tsconfig)
- **Path Aliases:** `@/*` → `./src/*`
- **Target:** ES2017

### Key Config Files
- `next.config.ts` — Sentry + PWA wrappers, CSP security headers
- `tailwind.config.ts` — Dark mode (class), shadcn/ui CSS variables
- `drizzle.config.ts` — PostgreSQL schema at `./src/db/schema.ts`
- `tsconfig.json` — Strict, incremental, react-jsx
- `eslint.config.mjs` — Flat config, next/core-web-vitals + next/typescript
- `.prettierrc` — prettier-plugin-tailwindcss
- `vitest.config.ts` — jsdom, path aliases, v8 coverage
- `playwright.config.ts` — Chromium, Firefox, WebKit, Mobile Chrome

## UI & Styling
- **CSS Framework:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Animation:** `tailwindcss-animate`, `tw-animate-css`, Framer Motion 12.x
- **Component Library:** Radix UI primitives (17+ packages) via shadcn/ui pattern
- **Icons:** Lucide React
- **Typography:** Inter (sans), JetBrains Mono (mono) via `next/font/google`
- **Theming:** `next-themes` (forcedTheme: dark)
- **Rich Text:** Tiptap 3.x (react, starter-kit, placeholder extension)
- **Charts:** Recharts 3.x
- **3D:** Three.js + @react-three/fiber + @react-three/drei
- **Drag & Drop:** @dnd-kit/core + sortable + utilities
- **Date Picker:** react-day-picker
- **Command Palette:** cmdk
- **Toasts:** Sonner
- **Forms:** react-hook-form + @hookform/resolvers + Zod 4.x

## Backend & Data
- **ORM:** Drizzle ORM 0.45.x (PostgreSQL dialect)
- **DB Driver:** `postgres` (postgres.js)
- **Database:** PostgreSQL (via `DATABASE_URL`)
- **Auth:** Clerk (`@clerk/nextjs` 6.x)
- **Server Actions:** Next.js `"use server"` pattern
- **State Management:** Zustand 5.x (with `persist` middleware, localStorage)
- **Data Fetching:** Server components + `unstable_cache` + `revalidateTag`

## External Services
- **AI:** Google Generative AI (`@google/generative-ai` 0.24.x via `GEMINI_API_KEY`)
- **Speech-to-Text:** Deepgram SDK (`@deepgram/sdk` 4.x via `DEEPGRAM_API_KEY`)
- **Calendar Sync:** Google Calendar API (OAuth, `GOOGLE_CLIENT_ID/SECRET`)
- **Error Tracking:** Sentry (`@sentry/nextjs` 10.x, replay integration)
- **PWA:** `@ducanh2912/next-pwa` (service worker in production only)

## Dev Dependencies
- **Testing:** Vitest 4.x + @testing-library/react 16.x + jsdom 27.x
- **E2E Testing:** Playwright 1.57.x
- **Linting:** ESLint 9 (flat config) + eslint-config-next
- **Formatting:** Prettier 3.x + prettier-plugin-tailwindcss
- **DB Tools:** drizzle-kit 0.31.x (`db:push`, `db:studio`)
- **NLP:** chrono-node 2.x (natural language date parsing)

## Scripts
| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build --webpack` |
| `lint` | `eslint` |
| `lint:strict` | `eslint --max-warnings 0` |
| `test` | `vitest` |
| `test:e2e` | `playwright test` |
| `test:coverage` | `vitest run --coverage` |
| `db:push` | `drizzle-kit push` |
| `db:studio` | `drizzle-kit studio` |
| `format` | `prettier --write .` |
