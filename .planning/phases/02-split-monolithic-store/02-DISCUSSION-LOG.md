# Phase 2: Split Monolithic Zustand Store - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-split-monolithic-store
**Areas discussed:** Slice boundaries, Type organization, Column/Kanban scope

---

## Slice Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| appSlice owns undo/redo | pushHistory, undo, redo live in appSlice; domain slices call via get() | ✓ |
| Separate historySlice | Dedicated slice for undo/redo only | |
| Inline per domain | Each domain handles its own undo/redo | |

**User's choice:** "you decide" — deferred to agent
**Notes:** Agent selected appSlice ownership because undo/redo inherently touches all domains (task, event, note, column) and needs a single history stack. Zustand's `get()` pattern allows domain slices to call `get().pushHistory()` naturally.

---

## Type Organization

| Option | Description | Selected |
|--------|-------------|----------|
| New src/store/types.ts | Dedicated types file co-located with store | ✓ |
| Keep in useStore.ts | Types stay where they are, slices import from useStore | |
| Move to src/types/index.ts | Use existing shared types file | |

**User's choice:** "you decide" — deferred to agent
**Notes:** Agent selected dedicated `types.ts` in the store directory. Keeps types co-located with their consumers while extracting them from the monolithic file. Re-exports from useStore.ts maintain backward compatibility.

---

## Column/Kanban Scope

| Option | Description | Selected |
|--------|-------------|----------|
| kanbanSlice owns columns | Columns, view settings, column CRUD all in kanbanSlice | ✓ |
| Shared columns in appSlice | Columns as shared state since tasks reference columnId | |
| Dedicated columnSlice | Separate slice just for columns | |

**User's choice:** "you decide" — deferred to agent
**Notes:** Agent selected kanbanSlice ownership per ROADMAP spec. Tasks use `columnId` as a string foreign key — no cross-slice coupling needed. This matches the ROADMAP's explicit description: "columns, view settings, drag state."

---

## Agent's Discretion

- Slice internal structure
- Import consolidation strategy
- Barrel exports from slices directory
- Default values placement

## Deferred Ideas

None — discussion stayed within phase scope.
