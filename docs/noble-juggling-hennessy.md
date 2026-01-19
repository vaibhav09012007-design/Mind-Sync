# Plan: Complete Design Overhaul (Mind Sync)

## Goal
Execute a complete visual transformation of the Mind Sync application, moving away from the "Cyber-Zen" aesthetic to a new design language defined by the user.

## Phase 1: Cleanup & Reset
- [x] **Remove Legacy Docs**: Delete `Test project/mind-sync/docs/UI_AND_3D_PLAN.md`.
- [x] **Remove 3D Components**: Delete `src/components/ui/3d` directory and remove references from layouts.
- [x] **Reset Design System**:
    - Revert `globals.css` to standard Shadcn HSL variables for Light/Dark mode.
    - Remove "Cyber-Zen" custom variables (`--surface`, `--glow`, etc.).
    - Update `tailwind.config.ts` to standard Shadcn configuration.

## Phase 2: Implementation (Minimalist Theme)
- [x] **Layout Configuration**:
    - Update `src/app/layout.tsx` to enable system theme support (remove `forcedTheme="dark"`).
    - Remove `SceneWrapper` and `NeuralBackground` from the root layout.
- [x] **Component Refactoring**:
    - **Dashboard**: Remove `FloatingIcon` usage; revert to clean Lucide icons.
    - **Cards**: Remove glassmorphism effects; use standard border/bg colors (`bg-card`, `border-border`).
    - **Sidebar & Nav**: Remove custom gradients and glass effects; use flat backgrounds with subtle borders.
    - **Landing Page**: Update `src/app/page.tsx` to be clean and minimal (black/white text, simple buttons).

## Phase 3: Verification
- [ ] **Theme Check**: Verify Light Mode looks clean (white background, dark text) and Dark Mode looks sleek (zinc/slate background, light text).
- [ ] **Build Check**: Ensure no missing component errors after deleting 3D files.
- [ ] **Functionality Check**: Verify standard Shadcn components (Dialogs, Sheets) still render correctly.
