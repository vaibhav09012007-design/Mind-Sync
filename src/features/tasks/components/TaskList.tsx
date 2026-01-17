"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as chrono from 'chrono-node';
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // ISO
}

interface TaskListProps {
  title: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onAdd: (title: string, date?: Date) => void;
  onDelete?: (id: string) => void;
}

function DraggableTaskItem({ task, onToggle, onDelete }: { task: Task, onToggle: (id: string) => void, onDelete?: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { task }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent/50 transition-colors bg-background border border-transparent hover:border-border/50"
        >
            <div {...listeners} {...attributes} className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground shrink-0">
                <GripVertical className="h-4 w-4" />
            </div>
            <Checkbox 
                checked={task.completed} 
                onCheckedChange={() => onToggle(task.id)}
                className="rounded-full shrink-0" 
            />
            <span
                className={cn(
                    "text-sm flex-1 truncate select-none cursor-pointer",
                    task.completed && "text-muted-foreground line-through"
                )}
                onClick={() => onToggle(task.id)}
            >
                {task.title}
            </span>
            {onDelete && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onDelete(task.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}

export function TaskList({ title, tasks, onToggle, onAdd, onDelete }: TaskListProps) {
  const [newTask, setNewTask] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleAddTask = () => {
    if (newTask.trim()) {
        // NLP Parsing
        const parsedResults = chrono.parse(newTask);
        let finalDate = date;
        const finalTitle = newTask;

        if (parsedResults.length > 0) {
            finalDate = parsedResults[0].start.date();
            // Optional: Strip the date text from the title if you want
            // finalTitle = newTask.replace(parsedResults[0].text, '').trim();
            toast.success(`Scheduled for ${format(finalDate, "MMM do")}`);
        }

        onAdd(finalTitle, finalDate);
        setNewTask("");
        setDate(new Date()); // Reset to today
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {tasks.map((task) => (
          <DraggableTaskItem 
            key={task.id} 
            task={task} 
            onToggle={onToggle} 
            onDelete={onDelete} 
          />
        ))}
        <div className="flex items-center gap-2 p-2 opacity-80 hover:opacity-100 transition-opacity pl-9 group focus-within:opacity-100">
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input 
                className="h-8 border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground flex-1 min-w-0" 
                placeholder="Add a task (e.g. 'Call John tomorrow')..." 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-6 w-6 text-muted-foreground", date && "text-primary")}>
                        <CalendarIcon className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
      </div>
    </div>
  );
}