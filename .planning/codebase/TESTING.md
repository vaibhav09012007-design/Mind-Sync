# Testing

## Unit Testing

### Framework
- **Runner:** Vitest 4.x
- **Environment:** jsdom 27.x
- **React Testing:** @testing-library/react 16.x + @testing-library/jest-dom 6.x
- **Config:** `vitest.config.ts`

### Setup
- **Setup file:** `src/test/setup.ts` — globals, jest-dom matchers
- **Path aliases:** `@/` → `./src/` (mirrored from tsconfig)
- **Globals:** `true` (describe, it, expect available without import)

### Coverage
- **Provider:** V8
- **Reporters:** text, json, html
- **Excludes:** node_modules, .next, *.d.ts, *.config.*, test/

### Test Location
Tests are co-located with source in `__tests__/` subdirectories:
- `src/store/__tests__/` — Store logic tests
- `src/lib/__tests__/` — Utility function tests
- `src/features/tasks/components/__tests__/` — Task component tests

### Existing Tests
- `src/features/tasks/components/__tests__/PriorityBadge.test.tsx` — Component rendering tests
- `src/store/__tests__/` — Store action tests
- `src/lib/__tests__/` — Utility tests

### Scripts
| Script | Command |
|--------|---------|
| `test` | `vitest` (watch mode) |
| `test:ui` | `vitest --ui` (browser UI) |
| `test:coverage` | `vitest run --coverage` |

## E2E Testing

### Framework
- **Runner:** Playwright 1.57.x
- **Config:** `playwright.config.ts`

### Setup
- **Test directory:** `e2e/`
- **Base URL:** `http://localhost:3000`
- **Web Server:** Auto-starts `npm run dev`
- **Parallel:** Fully parallel execution
- **Retries:** 2 on CI, 0 locally

### Browser Coverage
| Browser | Device |
|---------|--------|
| Chromium | Desktop Chrome |
| Firefox | Desktop Firefox |
| WebKit | Desktop Safari |
| Mobile Chrome | Pixel 5 |

### Existing Tests
- `e2e/app.spec.ts` — Basic application tests

### Artifacts
- **Trace:** On first retry
- **Screenshot:** Only on failure
- **Report:** HTML reporter
- **Output:** `playwright-report/`, `test-results/`

## Mocking Patterns
- `eslint-disable @typescript-eslint/no-explicit-any` used in test files for mock flexibility
- Browser APIs mocked via jsdom environment
- No dedicated mock setup files observed beyond `src/test/setup.ts`

## Test Coverage Gaps
- No tests for server actions (`src/actions/`)
- No tests for custom hooks (`src/hooks/`)
- No tests for AI features (`src/features/ai/`)
- Limited E2E coverage (single spec file)
- No integration tests for database operations
