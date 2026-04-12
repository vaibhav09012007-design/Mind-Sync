# Mind-Sync — Milestone 5 & 6 (Collaboration & AI)

## What This Is
Mind-Sync is an AI-powered productivity workspace combining tasks, calendar, notes, kanban boards, habit tracking, focus timer, and meeting mode. Built with Next.js 16, React 19, Drizzle ORM, Zustand, and Clerk auth.

## Core Value
Reliable, performant, and intelligent productivity workspace that teams and individuals trust.

## Context
Following the completion of technical debt and codebase performance improvements (M1-M4), we are moving to introduce real-time workspace collaboration (M5) and intelligent automation (M6). This introduces multi-tenant data concepts via Workspaces and live multiplayer experiences via PartyKit.

## What We're Building (This Milestone)
Collaboration & AI features:
1. **Workspaces** — Team environments with role-based access control.
2. **Real-time Collaboration** — Live cursors, PartyKit web sockets, and Yjs CRDTs for notes.
3. **Commenting** — Threads in tasks and notes.
4. **Natural Language Processing** — AI parsing of complex input into structured tasks/events.
5. **AI Auto-categorization & Smart Scheduling** — Calendar conflict resolution and auto-tagging.
6. **Delivery** — Weekly productivity reporting.

## Requirements

### Validated
- ✓ Task management (CRUD, subtasks, dependencies, bulk ops)
- ✓ Calendar integration (Google Calendar sync)
- ✓ Focus timer (Pomodoro)
- ✓ Habit tracking (streaks, logs)
- ✓ AI features (meeting summaries, smart suggestions)
- ✓ Meeting mode (speech recognition, transcription)
- ✓ Authentication (Clerk)
- ✓ Single User Base (No Teams context yet)

### Active
- [ ] Implement `workspaces` table and data segregation.
- [ ] Setup PartyKit WebSocket Server.
- [ ] Migrate Note Editor to Yjs.
- [ ] Integrate Natural Language parser in AI Route.
- [ ] Automate Task Categorization and conflict resolution layer.
- [ ] Deploy Weekly Cron endpoint.

### Out of Scope
- Desktop Application wrappers.
- End-to-End Encryption for notes (too complex for this milestone).

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
