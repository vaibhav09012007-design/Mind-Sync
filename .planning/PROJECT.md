# Mind-Sync — Codebase Improvement Milestone

## What This Is
Mind-Sync is an AI-powered productivity workspace combining tasks, calendar, notes, kanban boards, habit tracking, focus timer, and meeting mode. Built with Next.js 16, React 19, Drizzle ORM, Zustand, and Clerk auth.

## Core Value
Reliable, performant productivity workspace that users trust with their daily workflow.

## Context
This milestone addresses technical debt, code quality, and reliability issues identified during the codebase analysis. The app is functional but has architectural concerns that will compound as the codebase grows.

## What We're Building (This Milestone)
Codebase quality improvements:
1. **Fix broken server sync** — `updateTaskPriority` and `bulkUpdateTasks` don't persist to database
2. **Split monolithic Zustand store** — 1,100-line single store → domain-based slices
3. **Resolve ESLint suppressions** — Remove or properly fix 34 lint bypass comments
4. **Clean up stale files** — Remove `.css.bak`, knip artifacts from repo
5. **Add critical test coverage** — Server actions and key business logic

## Requirements

### Validated
- ✓ Task management (CRUD, subtasks, dependencies, bulk ops) — existing
- ✓ Calendar integration (Google Calendar sync) — existing
- ✓ Notes with rich text (Tiptap editor) — existing
- ✓ Kanban board (drag & drop, custom columns) — existing
- ✓ Focus timer (Pomodoro) — existing
- ✓ Habit tracking (streaks, logs) — existing
- ✓ AI features (meeting summaries, smart suggestions) — existing
- ✓ Meeting mode (speech recognition, transcription) — existing
- ✓ Authentication (Clerk) — existing
- ✓ PWA support — existing
- ✓ Error tracking (Sentry) — existing

### Active
- [ ] Fix server sync gaps in store actions
- [ ] Split monolithic store into domain slices
- [ ] Resolve ESLint suppressions properly
- [ ] Remove stale files from repository
- [ ] Add server action test coverage

### Out of Scope
- New features — this milestone is purely improvements
- UI/UX redesign — existing UI is fine
- Database schema changes — no migrations needed
- Dependency upgrades — version bumps are a separate concern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Zustand slices over separate stores | Keeps single store benefits (persist, hydration) while splitting logic | Pending |
| Sequential execution over parallel | Changes touch shared files (store, selectors) — must be sequential | Decided |
| Inherit model profile | Using whatever model is active in Antigravity session | Decided |

## Evolution
This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-31 after initialization*
