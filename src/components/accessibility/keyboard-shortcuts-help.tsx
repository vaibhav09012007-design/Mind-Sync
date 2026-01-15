"use client";

/**
 * Keyboard Shortcuts Help Overlay
 * Shows all available keyboard shortcuts when ? is pressed
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["Ctrl/⌘", "K"], description: "Open command menu" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "C"], description: "Go to Calendar" },
      { keys: ["G", "N"], description: "Go to Notes" },
      { keys: ["G", "F"], description: "Go to Focus" },
      { keys: ["G", "K"], description: "Go to Kanban" },
    ],
  },
  {
    title: "Tasks",
    shortcuts: [
      { keys: ["N"], description: "Quick add new task" },
      { keys: ["Enter"], description: "Open selected task" },
      { keys: ["Esc"], description: "Close dialog/modal" },
    ],
  },
  {
    title: "Focus Timer",
    shortcuts: [
      { keys: ["Space"], description: "Start/Pause timer" },
      { keys: ["R"], description: "Reset timer" },
      { keys: ["Z"], description: "Toggle Zen mode" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], description: "Show this help" },
      { keys: ["Ctrl/⌘", "Z"], description: "Undo" },
      { keys: ["Ctrl/⌘", "Shift", "Z"], description: "Redo" },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on ? key (Shift + /)
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 md:grid-cols-2">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div
                    key={i}
                    className="bg-muted/30 flex items-center justify-between gap-4 rounded-lg px-3 py-2"
                  >
                    <span className="text-foreground text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <kbd className="bg-muted text-foreground rounded px-2 py-1 text-xs font-medium">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground border-t pt-4 text-center text-xs">
          Press <kbd className="bg-muted rounded px-1.5 py-0.5">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
