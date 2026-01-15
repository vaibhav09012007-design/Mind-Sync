"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore, Priority, Task } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface CreateTaskDialogProps {
  children?: React.ReactNode;
  defaultColumnId?: string;
}

// Simplified subtask for creation (will be converted to Task[] on submit)
interface SubtaskInput {
  id: string;
  title: string;
  completed: boolean;
}

export function CreateTaskDialog({ children, defaultColumnId }: CreateTaskDialogProps) {
  const { addTask } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("P1");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [subtasks, setSubtasks] = useState<SubtaskInput[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [tags, setTags] = useState("");

  // Global keyboard shortcut for quick add (N key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea and N is pressed without modifiers
      if (
        e.key.toLowerCase() === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addSubtask = useCallback(() => {
    if (newSubtask.trim()) {
      setSubtasks((prev) => [
        ...prev,
        { id: uuidv4(), title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  }, [newSubtask]);

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Parse tags
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    // Convert subtask inputs to Task format
    const subtaskTasks: Task[] = subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      dueDate: new Date().toISOString(),
      columnId: "Todo",
    }));

    addTask(title, date, priority, defaultColumnId, {
      description,
      subtasks: subtaskTasks,
      estimatedMinutes,
      tags: tagArray,
    });
    toast.success("Task created successfully");

    // Reset and close
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("P1");
    setDate(new Date());
    setSubtasks([]);
    setNewSubtask("");
    setEstimatedMinutes(25);
    setTags("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your tracking system. Press{" "}
            <kbd className="bg-muted rounded px-1 text-xs">N</kbd> anywhere to quick add.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Review Q3 Financials"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0 - Critical</SelectItem>
                  <SelectItem value="P1">P1 - High</SelectItem>
                  <SelectItem value="P2">P2 - Medium</SelectItem>
                  <SelectItem value="P3">P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estimated Time</Label>
              <Select
                value={estimatedMinutes.toString()}
                onValueChange={(v) => setEstimatedMinutes(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="work, urgent (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Subtasks
            </Label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                >
                  <span className="flex-1 text-sm">{subtask.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
