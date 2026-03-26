"use client";

/**
 * Global Keyboard Shortcuts Provider
 * Handles navigation and global actions via keyboard
 */

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useHistory, useHistoryActions } from "@/store/selectors";

export function useGlobalKeyboardShortcuts() {
  const router = useRouter();
  const { canUndo, canRedo } = useHistory();
  const { undo, redo } = useHistoryActions();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Handle Ctrl/Cmd + Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Handle Ctrl/Cmd + Shift + Z for Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Handle Ctrl/Cmd + Y for Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Two-key sequences starting with 'g' (Go to...)
      if (pendingKey === "g") {
        e.preventDefault();
        setPendingKey(null);

        switch (e.key.toLowerCase()) {
          case "d":
            router.push("/dashboard");
            break;
          case "c":
            router.push("/calendar");
            break;
          case "n":
            router.push("/notes");
            break;
          case "f":
            router.push("/focus");
            break;
          case "a":
            router.push("/analytics");
            break;
          case "k":
            router.push("/kanban");
            break;
        }
        return;
      }

      // Start 'g' sequence
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPendingKey("g");
        // Clear pending key after 1 second if no follow-up
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }
    },
    [router, pendingKey, undo, redo, canUndo, canRedo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { pendingKey };
}

// Component wrapper that defers rendering until client-side mount
// to avoid SSR hydration issues with Zustand persist middleware
function GlobalKeyboardShortcutsInner() {
  useGlobalKeyboardShortcuts();
  return null;
}

export function GlobalKeyboardShortcuts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer to next tick to avoid synchronous set-state-in-effect warning
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;
  return <GlobalKeyboardShortcutsInner />;
}

