# Requirements — Milestone 5 & 6 (Collaboration & AI)

## v5 Requirements (Collaboration)

### Data Integrity & Architecture
- [ ] **COLLAB-01**: Database supports Workspaces (`workspaces`, `workspace_members`) and role-based access control.
- [ ] **COLLAB-02**: Tasks, Notes, Events, Goals, and Columns inherit `workspaceId` associations.
- [ ] **COLLAB-03**: Real-time websocket infrastructure deployed via PartyKit.

### Shared Features
- [ ] **COLLAB-04**: Live cursors over Kanban and Task boards for active users in a workspace.
- [ ] **COLLAB-05**: Notes support real-time collaborative editing using Yjs CRDTs synced via PartyKit.
- [ ] **COLLAB-06**: Commenting system allows inline threads on tasks and notes in real-time.

## v6 Requirements (AI & Automation)

### Natural Language
- [ ] **AUTO-01**: Global Command-K input bar for Natural Language Task/Event creation.
- [ ] **AUTO-02**: AI autonomously parses input semantics into strictly typed task structures.

### Background Intelligence
- [ ] **AUTO-03**: Freshly created tasks are dynamically tagged and prioritized via background Gemini processing if unstructured.
- [ ] **AUTO-04**: Smart scheduling detects calendar overlaps and uses AI context to suggest alternative time slots.
- [ ] **AUTO-05**: Weekly automated productivity report generated using Drizzle telemetry aggregations and dispatched via Email Cron.

## Traceability

| Requirement | Phase |
|-------------|-------|
| COLLAB-01, COLLAB-02 | Phase 1 |
| COLLAB-03, COLLAB-04 | Phase 2 |
| COLLAB-05 | Phase 3 |
| COLLAB-06 | Phase 4 |
| AUTO-01, AUTO-02 | Phase 5 |
| AUTO-03 | Phase 6 |
| AUTO-04 | Phase 7 |
| AUTO-05 | Phase 8 |

---
*Last updated: 2026-03-31 after initialization*
