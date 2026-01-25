"use client";

import { TaskList } from "@/features/tasks/components/TaskList";
import { useStore, Task } from "@/store/useStore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deleteCompletedTasks } from "@/actions/tasks";
import { toast } from "sonner";

interface TaskColumnProps {
  currentDate: Date;
  onNextDay: () => void;
  onPrevDay: () => void;
}

export function TaskColumn({ currentDate, onNextDay, onPrevDay }: TaskColumnProps) {
  const { tasks, addTask, toggleTask, deleteTask, setTasks } = useStore();

  // Filter Data locally for display
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);

  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < startOfToday && !t.completed);
  const todaysTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), currentDate) && !t.completed);
  const completedTasks = tasks.filter(t => isSameDay(new Date(t.dueDate), currentDate) && t.completed);

  const totalDayTasks = todaysTasks.length + completedTasks.length;
  const progressPercent = totalDayTasks > 0 ? (completedTasks.length / totalDayTasks) * 100 : 0;

  const handleClearCompleted = async () => {
      // Optimistic update
      const activeTasks = tasks.filter(t => !t.completed);
      setTasks(activeTasks);
      
      try {
          await deleteCompletedTasks();
          toast.success("Completed tasks cleared");
      } catch (e) {
          console.error(e);
          toast.error("Failed to clear tasks");
      }
  };

  return (
    <div className="w-full lg:w-[35%] lg:min-w-[320px] flex flex-col gap-6 lg:h-full overflow-hidden">
        <div className="flex-shrink-0 space-y-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-1">Good Morning</h1>
                <div className="flex items-center justify-between text-muted-foreground">
                    <p>Here is your quest for {format(currentDate, "MMMM do")}.</p>
                    <div className="flex gap-1 md:hidden">
                        <Button variant="ghost" size="icon" onClick={onPrevDay}><ChevronLeft className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={onNextDay}><ChevronRight className="h-4 w-4"/></Button>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span>Daily Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                                {completedTasks.length > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                                        onClick={handleClearCompleted}
                                        title="Clear completed tasks"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            <span>{completedTasks.length} Done</span>
                            <span>{todaysTasks.length} Remaining</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 lg:pb-0 scrollbar-thin">
            <AnimatePresence>
                {overdueTasks.length > 0 && (
                    <motion.div key="overdue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <TaskList
                            title="Overdue"
                            tasks={overdueTasks}
                            onToggle={toggleTask}
                            onAdd={(title, date) => addTask(title, date || new Date(Date.now() - 86400000))}
                            onDelete={deleteTask}
                        />
                    </motion.div>
                )}

                <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <TaskList
                        title="Today"
                        tasks={todaysTasks}
                        onToggle={toggleTask}
                        onAdd={(title, date) => addTask(title, date || currentDate)}
                        onDelete={deleteTask}
                    />
                </motion.div>

                {completedTasks.length > 0 && (
                    <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <TaskList
                            title="Completed"
                            tasks={completedTasks}
                            onToggle={toggleTask}
                            onAdd={() => {}}
                            onDelete={deleteTask}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
