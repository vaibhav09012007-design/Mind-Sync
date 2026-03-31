# Code Conventions

## Code Style
- **Formatter:** Prettier with `prettier-plugin-tailwindcss`
- **Linter:** ESLint 9 flat config (`eslint-config-next/core-web-vitals` + `/typescript`)
- **Strict TypeScript:** `strict: true` in tsconfig
- **Semicolons:** Yes (default Prettier)
- **Quotes:** Double quotes (default Prettier)
- **Indent:** 2 spaces

## Naming Conventions

### Files
- **React components:** PascalCase (`DashboardShell.tsx`, `StoreHydrator.tsx`, `ThemeToggle.tsx`)
- **Utilities/hooks:** kebab-case (`use-soundscapes.ts`, `rate-limiter.ts`, `toast-queue.ts`)
- **Some hooks use camelCase:** `useStore.ts`, `useMemoization.ts`, `useKeyboardShortcuts.ts`
- **Server actions:** kebab-case domain files (`tasks.ts`, `events.ts`, `ai.ts`)
- **Tests:** `*.test.ts` / `*.test.tsx` in `__tests__/` subdirectories

### Variables & Functions
- **React components:** PascalCase (`FocusTimer`, `KanbanBoard`)
- **Functions:** camelCase (`createTask`, `toggleTaskStatus`, `requireAuth`)
- **Constants:** UPPER_SNAKE_CASE for config (`MAX_HISTORY`, `DEFAULT_COLUMNS`, `CACHE_TAGS`)
- **Types/Interfaces:** PascalCase (`Task`, `CalendarEvent`, `AppState`, `ActionResult`)
- **Enums (DB):** camelCase variable, string values (`statusEnum`, `priorityEnum`)

### Directories
- kebab-case throughout (`meeting-mode`, `focus-timer`)
- Route groups use parentheses: `(auth)`, `(dashboard)`

## Component Patterns

### shadcn/ui Pattern
Components in `src/components/ui/` follow the shadcn/ui pattern:
- Radix UI primitive wrapped with `forwardRef`
- Styled with `class-variance-authority` (CVA) for variants
- Combined with `clsx` + `tailwind-merge` via `cn()` utility
- Barrel exported from `src/components/ui/index.ts`

```tsx
// Example pattern from src/components/ui/button.tsx
const buttonVariants = cva("inline-flex items-center...", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "...", icon: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### Feature Module Pattern
Features are organized in `src/features/<name>/components/`:
- Each feature directory contains only a `components/` subdirectory
- Components are feature-specific, not shared across features
- Feature logic (non-component) lives in feature root (e.g., `src/features/ai/advanced-ai.ts`)

### Server Action Pattern
All server actions follow a consistent structure:
```tsx
"use server";
export async function actionName(data: InputType): Promise<ActionResult<ReturnType>> {
  try {
    const { userId } = await requireAuth();           // 1. Auth
    const rateLimit = await checkRateLimit(...);       // 2. Rate limit
    const validated = schema.safeParse(data);          // 3. Validate (Zod)
    await ensureUserExists(userId);                    // 4. User sync
    await db.operation(...);                           // 5. DB operation
    revalidatePath("/dashboard");                      // 6. Cache bust
    revalidateTag(CACHE_TAGS.tasks(userId), "default");
    return createSuccessResult(data);                  // 7. Return typed result
  } catch (error) {
    return createErrorResult(error);                   // 8. Typed error
  }
}
```

### Store Pattern (Zustand)
- Single monolithic store with `persist` middleware
- **Optimistic updates:** Mutate store immediately, then call server action, rollback on failure
- **History tracking:** `pushHistory()` for undo/redo support
- **Selectors:** Individual primitive selectors in `selectors.ts` + backward-compatible object selectors
- **Hydration:** `StoreHydrator.tsx` runs in a `useEffect` to sync server data
- **Toast feedback:** `showToast.success/error/info` from `src/lib/toast-queue.ts`

## Error Handling
- **Server side:** Custom error hierarchy (`AppError` → `ValidationError`, `AuthError`, `NotFoundError`, `RateLimitError`, `APIError`)
- **Result type:** `ActionResult<T> = { success: true; data: T } | { success: false; error: string; code?: string }`
- **Client side:** try/catch in store actions with `logger.error()` + `showToast.error()`
- **Global:** `global-error.tsx` Sentry error boundary, `route-error.tsx` route boundary, `not-found.tsx` 404 page

## Import Conventions
- Path aliases: `@/*` maps to `./src/*`
- Barrel exports in `src/actions/index.ts`, `src/components/ui/index.ts`
- Next.js imports: `import { ... } from "next/cache"`, `"next/font/google"`
- Server directives: `"use server"` at top of action files

## CSS Conventions
- **Tailwind CSS v4** with CSS custom properties (HSL color scheme)
- **Dark mode:** `class` strategy, forced dark in production
- **Component styling:** CVA variants for component-level styles
- **Global CSS:** `src/app/globals.css` — custom properties, base styles, animations
- **Animation:** Mix of `tailwindcss-animate`, `tw-animate-css`, and Framer Motion
