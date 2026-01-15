"use client";

/**
 * Global Keyboard Shortcuts Provider
 * Handles navigation and global actions via keyboard
 */

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

export function useGlobalKeyboardShortcuts() {
  const router = useRouter();
  const { undo, redo, canUndo, canRedo } = useStore();
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

// Component wrapper for the hook
export function GlobalKeyboardShortcuts() {
  useGlobalKeyboardShortcuts();
  return null;
}
