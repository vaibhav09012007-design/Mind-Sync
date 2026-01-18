"use client";

import { useState } from "react";
import { useStore, Task } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDependencyPickerProps {
  value?: string;
  onChange: (taskId: string | undefined) => void;
  excludeTaskId?: string; // Don't show this task in the list (for edit mode)
}

export function TaskDependencyPicker({
  value,
  onChange,
  excludeTaskId,
}: TaskDependencyPickerProps) {
  const { tasks } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter out completed tasks and the current task
  const availableTasks = tasks.filter(
    (t) =>
      !t.completed &&
      t.id !== excludeTaskId &&
      t.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTask = value ? tasks.find((t) => t.id === value) : null;

  const handleSelect = (task: Task) => {
    onChange(task.id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Blocked by</label>

      {selectedTask ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <Link2 className="h-4 w-4 text-orange-500" />
          <span className="flex-1 text-sm">{selectedTask.title}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-muted-foreground"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Add dependency...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="border-b p-2">
              <div className="flex items-center gap-2 px-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 border-0 focus-visible:ring-0"
                />
              </div>
            </div>
            <ScrollArea className="h-[200px]">
              {availableTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No tasks found
                </div>
              ) : (
                <div className="p-1">
                  {availableTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelect(task)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                        "text-left transition-colors"
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          task.priority === "P0" && "bg-red-500",
                          task.priority === "P1" && "bg-orange-500",
                          task.priority === "P2" && "bg-blue-500",
                          task.priority === "P3" && "bg-gray-400",
                          !task.priority && "bg-gray-400"
                        )}
                      />
                      <span className="flex-1 truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      <p className="text-xs text-muted-foreground">
        This task will be blocked until the selected task is completed.
      </p>
    </div>
  );
}
