"use client";

/**
 * Enhanced Command Palette with Natural Language AI input
 * Supports both command search and free-form NL task/event creation
 */

import { useState, useCallback, useTransition } from "react";
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
  FileText,
  Home,
  Plus,
  Settings,
  Sparkles,
  Clock,
  Wand2,
  Target,
  BarChart3,
  Kanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, defaultShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { parseNaturalLanguageIntent, type ParsedIntent } from "@/actions/ai-parse";
import { AIPreview } from "@/components/command-palette/ai-preview";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

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
  const [inputValue, setInputValue] = useState("");
  const [aiIntent, setAiIntent] = useState<ParsedIntent | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const router = useRouter();
  const addTask = useStore((s) => s.addTask);
  const addEvent = useStore((s) => s.addEvent);

  // Register keyboard shortcuts
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
    setAiIntent(null);
    setInputValue("");
    command();
  }, []);

  // Trigger NL parsing when user types something that doesn't match commands
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setAiIntent(null);
  };

  const handleAIParse = () => {
    if (!inputValue.trim() || inputValue.trim().length < 3) return;

    startParsing(async () => {
      const result = await parseNaturalLanguageIntent(inputValue);
      if (result.success && result.data) {
        setAiIntent(result.data);
      }
    });
  };

  const handleConfirmIntent = () => {
    if (!aiIntent) return;

    startCreating(async () => {
      try {
        if (aiIntent.action === "CREATE_TASK") {
          addTask(
            aiIntent.title,
            aiIntent.dueDate ? new Date(aiIntent.dueDate) : undefined,
            aiIntent.priority,
            undefined,
            {
              description: aiIntent.description,
              tags: aiIntent.tags,
            }
          );
          toast.success(`Task created: ${aiIntent.title}`);
        } else if (aiIntent.action === "CREATE_EVENT") {
          addEvent({
            title: aiIntent.title,
            start: aiIntent.startTime ?? new Date().toISOString(),
            end: aiIntent.endTime ?? new Date(Date.now() + 3600000).toISOString(),
            type: aiIntent.eventType ?? "work",
            googleId: `local-ai-${crypto.randomUUID()}`,
          });
          toast.success(`Event created: ${aiIntent.title}`);
        }

        setOpen(false);
        setAiIntent(null);
        setInputValue("");
      } catch {
        toast.error("Failed to create item");
      }
    });
  };

  const handleCancelIntent = () => {
    setAiIntent(null);
  };

  return (
    <CommandDialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) {
        setAiIntent(null);
        setInputValue("");
      }
    }}>
      <CommandInput
        placeholder="Type a command, or describe a task/event in natural language..."
        value={inputValue}
        onValueChange={handleInputChange}
      />
      <CommandList>
        {/* AI Intent Preview */}
        {aiIntent && (
          <div className="p-2">
            <AIPreview
              intent={aiIntent}
              onConfirm={handleConfirmIntent}
              onCancel={handleCancelIntent}
              isLoading={isCreating}
            />
          </div>
        )}

        {!aiIntent && (
          <>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                <p className="text-sm text-muted-foreground">No commands found.</p>
                {inputValue.trim().length >= 3 && (
                  <button
                    onClick={handleAIParse}
                    disabled={isParsing}
                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Wand2 className="h-4 w-4" />
                    {isParsing ? "Parsing..." : "Parse with AI"}
                  </button>
                )}
              </div>
            </CommandEmpty>

            {/* Quick Actions */}
            <CommandGroup heading="Quick Actions">
              {inputValue.trim().length >= 3 && (
                <CommandItem onSelect={handleAIParse}>
                  <Wand2 className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">
                    {isParsing ? "Parsing..." : `Create from: "${inputValue.slice(0, 40)}${inputValue.length > 40 ? "..." : ""}"`}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">AI</span>
                </CommandItem>
              )}
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
              <CommandItem onSelect={() => runCommand(() => router.push("/kanban"))}>
                <Kanban className="mr-2 h-4 w-4" />
                <span>Kanban Board</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/habits"))}>
                <Target className="mr-2 h-4 w-4" />
                <span>Habits</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Analytics</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
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
