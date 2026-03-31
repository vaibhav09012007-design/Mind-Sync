# Phase 2: Split Monolithic Zustand Store - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Decompose the ~1,100-line monolithic `useStore.ts` into 6 domain-based Zustand slices while preserving the single store benefits (persist, hydration, selectors). All existing selectors in `selectors.ts` must continue to work without changes. No user-facing behavior changes.

</domain>

<decisions>
## Implementation Decisions

### Slice Boundaries & Cross-Slice Dependencies
- **D-01:** `appSlice` owns undo/redo history state (`history`, `historyIndex`, `canUndo`, `canRedo`) and the `pushHistory`, `undo`, `redo` actions
- **D-02:** Domain slices (task, event, note) call `get().pushHistory()` via Zustand's shared `set`/`get` from the composed store — this is the standard Zustand slice composition pattern
- **D-03:** Each slice receives `(set, get)` from the composed store, enabling cross-slice reads (e.g., taskSlice reading columns for validation)

### Type Organization
- **D-04:** Create `src/store/types.ts` for all store-related types (`Task`, `CalendarEvent`, `Note`, `Column`, `Notification`, `Priority`, `TimerMode`, `TimerSettings`, `ViewSettings`, `ViewMode`, `Density`, `Attachment`, `HistoryEntry`, `AppState`)
- **D-05:** Each slice file imports only the types it needs from `types.ts`
- **D-06:** Re-export all types from `useStore.ts` for backward compatibility (existing imports like `import { Task } from '@/store/useStore'` continue to work)

### Column/Kanban Scope
- **D-07:** `kanbanSlice` owns columns, view settings (`ViewSettings`), and column CRUD actions (add, update, delete, reorder)
- **D-08:** Tasks reference `columnId` as a plain string foreign key — no cross-slice dependency needed, just data reference

### Agent's Discretion
- Slice internal structure (how each slice organizes its actions)
- Import consolidation strategy (whether to merge the fragmented action imports at top of current useStore.ts)
- Whether to add barrel exports from `src/store/slices/index.ts`
- Default values placement (DEFAULT_COLUMNS, DEFAULT_VIEW_SETTINGS, DEFAULT_TIMER_SETTINGS) — co-locate with owning slice

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Store Architecture
- `.planning/codebase/ARCHITECTURE.md` — Documents current state layer: monolithic store, selectors, persistence, hydration pattern
- `.planning/codebase/CONVENTIONS.md` — Store pattern section: optimistic updates, history tracking, toast feedback, selector patterns
- `.planning/codebase/STRUCTURE.md` — Current `src/store/` directory layout

### Requirements
- `.planning/REQUIREMENTS.md` — STORE-01 through STORE-08 acceptance criteria
- `.planning/ROADMAP.md` — Phase 2 definition with exact slice names and success criteria

### Source Files (must read before implementing)
- `src/store/useStore.ts` — The monolithic store to be decomposed (~1,100 lines)
- `src/store/selectors.ts` — All selectors that must remain backward compatible (175 lines)
- `src/components/StoreHydrator.tsx` — Hydration component that calls setTasks/setEvents/setNotes/setColumns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `selectors.ts` — Already has granular selectors per domain; backward-compatible object selectors compose individual ones. This file should need zero changes.
- `StoreHydrator.tsx` — Uses `setTasks`, `setEvents`, `setNotes`, `setColumns` — these hydration setters move to their respective slices but remain on the composed store interface.

### Established Patterns
- **Optimistic Update Pattern:** Mutate store → push history → call server action → rollback on failure. Each domain slice follows this consistently.
- **Zustand persist middleware:** Uses `createJSONStorage` with localStorage. The composed store wraps all slices in a single `persist()` call.
- **Toast feedback:** `showToast.success/error/info` used throughout actions for user feedback.

### Integration Points
- **Type exports:** Many components import types (`Task`, `CalendarEvent`, `Note`, etc.) directly from `@/store/useStore` — backward compatibility via re-exports is essential.
- **Server action imports:** Each domain's server actions are imported at the top of useStore.ts and will move to their respective slice files.
- **`uuid` dependency:** Used in task, event, and notification actions for ID generation.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all decisions to agent discretion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-split-monolithic-store*
*Context gathered: 2026-03-31*
