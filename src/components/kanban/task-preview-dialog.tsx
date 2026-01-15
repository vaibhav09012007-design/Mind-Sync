"use client";

import { Task, useStore, Priority } from "@/store/useStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Tag,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TaskPreviewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskPreviewDialog({ task, open, onOpenChange }: TaskPreviewDialogProps) {
  const { updateTask, toggleTask, deleteTask } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPriority, setEditedPriority] = useState<Priority>("P2");
  const [editedDueDate, setEditedDueDate] = useState<Date | undefined>();

  if (!task) return null;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
    }
    onOpenChange(newOpen);
  };

  const handleStartEdit = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || "");
    setEditedPriority(task.priority || "P2");
    setEditedDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateTask(task.id, {
      title: editedTitle,
      description: editedDescription,
      priority: editedPriority,
      dueDate: editedDueDate?.toISOString(),
    });
    setIsEditing(false);
    toast.success("Task updated");
  };

  const handleToggleComplete = () => {
    toggleTask(task.id);
    toast.success(task.completed ? "Task marked as pending" : "Task completed!");
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onOpenChange(false);
    toast.success("Task deleted");
  };

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);

    if (isPast(date) && !task.completed) {
      return { text: "Overdue", className: "text-red-500 bg-red-500/10" };
    }
    if (isToday(date)) {
      return { text: "Due today", className: "text-amber-500 bg-amber-500/10" };
    }
    if (isTomorrow(date)) {
      return { text: "Due tomorrow", className: "text-blue-500 bg-blue-500/10" };
    }
    return { text: format(date, "MMM d, yyyy"), className: "text-muted-foreground bg-muted" };
  };

  const dueDateStatus = getDueDateStatus();

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const priorityColors: Record<Priority, string> = {
    P0: "bg-red-500/10 text-red-500 border-red-500/20",
    P1: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    P2: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    P3: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className={cn(
                    "text-xl font-semibold",
                    task.completed && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </DialogTitle>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">Task details and actions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors",
                task.completed
                  ? "border-green-500/20 bg-green-500/10 text-green-500"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-500"
              )}
              onClick={handleToggleComplete}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {task.completed ? "Completed" : "Pending"}
            </Badge>

            {isEditing ? (
              <Select
                value={editedPriority}
                onValueChange={(v) => setEditedPriority(v as Priority)}
              >
                <SelectTrigger className="h-7 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              task.priority && (
                <Badge variant="outline" className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
              )
            )}

            {dueDateStatus && !isEditing && (
              <Badge variant="outline" className={dueDateStatus.className}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {dueDateStatus.text}
              </Badge>
            )}

            {isEditing && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {editedDueDate ? format(editedDueDate, "MMM d") : "Set date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editedDueDate}
                    onSelect={setEditedDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Description */}
          {isEditing ? (
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editedDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditedDescription(e.target.value)
                }
                placeholder="Add a description..."
                rows={3}
              />
            </div>
          ) : (
            task.description && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-sm">{task.description}</p>
              </div>
            )
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && !isEditing && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && !isEditing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtasks</span>
                <span className="font-medium">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Time Estimate */}
          {task.estimatedMinutes && !isEditing && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Estimated: {task.estimatedMinutes} minutes</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant={task.completed ? "outline" : "default"}
                onClick={handleToggleComplete}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {task.completed ? "Mark Pending" : "Mark Complete"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
