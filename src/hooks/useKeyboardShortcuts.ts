"use client";

import { useEffect, useCallback, useRef } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  combo: KeyCombo;
  handler: ShortcutHandler;
  description: string;
  global?: boolean; // If true, works even when input is focused
}

/**
 * Hook for managing keyboard shortcuts
 * 
 * @example
 * useKeyboardShortcuts([
 *   {
 *     combo: { key: 'n', ctrl: true },
 *     handler: () => openNewTaskDialog(),
 *     description: 'Create new task'
 *   }
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInputFocused = 
      target.tagName === "INPUT" || 
      target.tagName === "TEXTAREA" || 
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      const { combo, handler, global } = shortcut;

      // Skip if input is focused and shortcut is not global
      if (isInputFocused && !global) continue;

      const keyMatches = e.key.toLowerCase() === combo.key.toLowerCase();
      const ctrlMatches = !!combo.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatches = !!combo.shift === e.shiftKey;
      const altMatches = !!combo.alt === e.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        e.preventDefault();
        handler(e);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get a formatted string for displaying a keyboard shortcut
 */
export function formatShortcut(combo: KeyCombo): string {
  const parts: string[] = [];
  
  if (combo.ctrl) parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  if (combo.shift) parts.push("Shift");
  if (combo.alt) parts.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
  
  parts.push(combo.key.toUpperCase());
  
  return parts.join(navigator.platform.includes("Mac") ? "" : "+");
}

/**
 * Default application shortcuts
 */
export const defaultShortcuts = {
  newTask: { key: "n", ctrl: true } as KeyCombo,
  newEvent: { key: "e", ctrl: true } as KeyCombo,
  newNote: { key: "m", ctrl: true, shift: true } as KeyCombo,
  commandPalette: { key: "/", ctrl: true } as KeyCombo,
  search: { key: "k", ctrl: true } as KeyCombo,
  undo: { key: "z", ctrl: true } as KeyCombo,
  redo: { key: "z", ctrl: true, shift: true } as KeyCombo,
  save: { key: "s", ctrl: true } as KeyCombo,
  goToDashboard: { key: "1", ctrl: true } as KeyCombo,
  goToCalendar: { key: "2", ctrl: true } as KeyCombo,
  goToNotes: { key: "3", ctrl: true } as KeyCombo,
  escape: { key: "Escape" } as KeyCombo,
};
