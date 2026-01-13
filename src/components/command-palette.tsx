"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calendar,
  CheckSquare,
  FileText,
  Home,
  Plus,
  Settings,
  Sparkles,
  Search,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, defaultShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";

interface CommandPaletteProps {
  onNewTask?: () => void;
  onNewEvent?: () => void;
  onNewNote?: () => void;
  onAISchedule?: () => void;
}

export function CommandPalette({
  onNewTask,
  onNewEvent,
  onNewNote,
  onAISchedule,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Register keyboard shortcut to open command palette
  useKeyboardShortcuts([
    {
      combo: defaultShortcuts.commandPalette,
      handler: () => setOpen(true),
      description: "Open command palette",
      global: true,
    },
    {
      combo: defaultShortcuts.search,
      handler: () => setOpen(true),
      description: "Search",
      global: true,
    },
  ]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {onNewTask && (
            <CommandItem onSelect={() => runCommand(onNewTask)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Task</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatShortcut(defaultShortcuts.newTask)}
              </span>
            </CommandItem>
          )}
          {onNewEvent && (
            <CommandItem onSelect={() => runCommand(onNewEvent)}>
              <Clock className="mr-2 h-4 w-4" />
              <span>New Event</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatShortcut(defaultShortcuts.newEvent)}
              </span>
            </CommandItem>
          )}
          {onNewNote && (
            <CommandItem onSelect={() => runCommand(onNewNote)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>New Note</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatShortcut(defaultShortcuts.newNote)}
              </span>
            </CommandItem>
          )}
          {onAISchedule && (
            <CommandItem onSelect={() => runCommand(onAISchedule)}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>AI Schedule Today</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatShortcut(defaultShortcuts.goToDashboard)}
            </span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatShortcut(defaultShortcuts.goToCalendar)}
            </span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Notes</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatShortcut(defaultShortcuts.goToNotes)}
            </span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to control the command palette programmatically
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
