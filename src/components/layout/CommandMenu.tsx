"use client";

import * as React from "react";
import {
  Calendar,
  CheckSquare,
  FileText,
  Mic,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useStore } from "@/store/useStore";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { notes, tasks, addNote, addTask } = useStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>Go to Day Planner</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Go to Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Go to Notes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/meeting"))}>
            <Mic className="mr-2 h-4 w-4" />
            <span>Go to Meeting Mode</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Notes">
          {notes.slice(0, 5).map((note) => (
            <CommandItem
              key={note.id}
              onSelect={() => runCommand(() => router.push(`/notes/${note.id}`))}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>{note.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 5).map((task) => (
            <CommandItem
              key={task.id}
              onSelect={() => runCommand(() => {})} // Focus task logic could go here
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>{task.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
