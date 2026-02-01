# Mind-Sync Production Readiness Plan

## Executive Summary
Mind-Sync has a solid foundation with Next.js 16, Drizzle ORM, and Clerk Auth. However, it lacks active rate limiting, comprehensive API protection, and a robust caching strategy for high concurrency. The PWA implementation is basic and needs enhancement for a native-like mobile experience.

## Phase 1: Security Hardening (High Priority)

### 1.1 Implement Rate Limiting
**Current Status:** `rate_limits` table exists but is unused.
**Action Plan:**
*   Create a reusable `rateLimit(userId: string, action: string)` function in `src/lib/rate-limit.ts`.
*   Apply rate limiting to all Server Actions (`src/actions/*.ts`) and API routes.
*   **Limit:** 100 requests/minute for standard actions, stricter for AI endpoints (10/minute).

### 1.2 Secure API Routes & Actions
**Current Status:** Basic middleware protection.
**Action Plan:**
*   **Audit `src/actions/*.ts`**: Ensure every exported action starts with `auth().protect()` or checks `userId`.
*   **Protect `api/deepgram/route.ts`**: Ensure it verifies the user session before generating tokens.
*   **CSP Activation**: Uncomment and refine the Content Security Policy in `next.config.ts`.

### 1.3 Database Security
**Current Status:** RLS handled via application logic.
**Action Plan:**
*   Verify all Drizzle queries include `where(eq(table.userId, user.id))` to prevent data leaks.

## Phase 2: Performance & Scalability (High Priority)

### 2.1 Caching Strategy
**Current Status:** Direct DB calls.
**Action Plan:**
*   Implement **Request Memoization** (React `cache`) for data fetching functions to avoid duplicate DB calls in a single render pass.
*   Use `unstable_cache` for expensive aggregations (e.g., analytics stats) with revalidation tags (e.g., `revalidateTag('tasks')`).

### 2.2 Database Optimization
**Current Status:** Indexes exist.
**Action Plan:**
*   Review `src/db/schema.ts` to ensure composite indexes match query patterns (e.g., `userId` + `date` for calendar events).
*   Enable connection pooling in Drizzle config (if not already set) for serverless deployment.

### 2.3 Asset Optimization
**Current Status:** Basic.
**Action Plan:**
*   Ensure all images use `next/image` with proper sizing.
*   Analyze bundle size and lazy load heavy feature modules (Kanban, Charts).

## Phase 3: Mobile & PWA Experience (Medium Priority)

### 3.1 PWA Enhancement
**Current Status:** Basic `manifest.json`.
**Action Plan:**
*   Add **Service Worker** (`next-pwa` or custom) for offline fallback page and asset caching.
*   Update `manifest.json` with screenshots and "standalone" display mode.
*   Add iOS splash screens and meta tags (`apple-mobile-web-app-capable`).

### 3.2 Mobile UX Polish
**Current Status:** Responsive UI.
**Action Plan:**
*   Implement touch gestures (swipe-to-delete already exists, expand to other lists).
*   Prevent "pull-to-refresh" on the body to allow custom app-like interactions.
*   Ensure input fields don't zoom on focus (font-size >= 16px).

## Phase 4: Reliability & Monitoring (Low Priority)

### 4.1 Error Handling
**Current Status:** `global-error.tsx` exists.
**Action Plan:**
*   Add `Sentry` or similar for real-time error tracking (optional but recommended).
*   Ensure graceful degradation if AI services (Gemini/Deepgram) fail.

---

## Implementation Steps (Detailed)

1.  **Step 1: Rate Limiting & Action Security**
    *   Create `src/lib/rate-limit.ts`.
    *   Wrap all actions in `src/actions/`.
2.  **Step 2: Caching Layer**
    *   Refactor `src/lib/data-fetchers.ts` (create if missing) to use `unstable_cache`.
3.  **Step 3: PWA & Mobile**
    *   Install `next-pwa`.
    *   Update manifest and meta tags.
4.  **Step 4: CSP & Final Polish**
    *   Enable CSP in `next.config.ts`.
    *   Run final load test.
