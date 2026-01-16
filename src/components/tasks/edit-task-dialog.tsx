"use client";

/**
 * Edit Task Dialog
 * Allows editing existing tasks with subtask management
 */

import { useState, useEffect } from "react";
import { useStore, Priority, Task } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CalendarIcon, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const { updateTask, deleteTask, toggleSubtask } = useStore();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority || "P1");
  const [date, setDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes || 25);
  const [tags, setTags] = useState(task.tags?.join(", ") || "");
  const [subtasks, setSubtasks] = useState<Task["subtasks"]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "P1");
    setDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setEstimatedMinutes(task.estimatedMinutes || 25);
    setTags(task.tags?.join(", ") || "");
    setSubtasks(task.subtasks || []);
  }, [task]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const newSubtaskItem: Task = {
        id: uuidv4(),
        title: newSubtask.trim(),
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: task.columnId,
      };
      setSubtasks([...(subtasks || []), newSubtaskItem]);
      setNewSubtask("");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks?.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)) || []
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks?.filter((st) => st.id !== subtaskId) || []);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: date?.toISOString(),
      estimatedMinutes,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      subtasks,
    });

    toast.success("Task updated successfully");
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    toast.success("Task deleted");
    onOpenChange(false);
  };

  const completedSubtasks = subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = subtasks?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details and manage subtasks.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">🔴 P0 - Critical</SelectItem>
                  <SelectItem value="P1">🟠 P1 - High</SelectItem>
                  <SelectItem value="P2">🟡 P2 - Medium</SelectItem>
                  <SelectItem value="P3">🟢 P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimated">Estimated Time (minutes)</Label>
            <Input
              id="estimated"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              min={5}
              step={5}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, urgent, design"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label>Subtasks {totalSubtasks > 0 && `(${completedSubtasks}/${totalSubtasks})`}</Label>

            {/* Existing subtasks */}
            {subtasks && subtasks.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subtask */}
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())}
              />
              <Button variant="outline" size="icon" onClick={handleAddSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
