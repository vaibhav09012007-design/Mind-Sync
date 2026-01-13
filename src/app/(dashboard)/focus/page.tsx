"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { Play, Pause, RotateCcw, CheckCircle2, Zap } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress"; // I will need to create this or use a simple SVG
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function FocusPage() {
  const { tasks, toggleTask } = useStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTask = tasks.find(t => t.id === selectedTaskId);
  
  // Filter incomplete tasks
  const todoTasks = tasks.filter(t => !t.completed);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      if (mode === "work") {
          toast.success("Focus session complete! Take a break.");
          setMode("break");
          setTimeLeft(5 * 60);
      } else {
          toast.info("Break is over. Ready to focus?");
          setMode("work");
          setTimeLeft(25 * 60);
      }
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const handleTaskComplete = () => {
      if (selectedTaskId) {
          toggleTask(selectedTaskId);
          toast.success("Task completed!");
          setSelectedTaskId("");
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === "work" 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto p-6">
       <div className="text-center space-y-2">
           <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
           <p className="text-muted-foreground">Select a task and start the timer.</p>
       </div>

       <Card className="w-full bg-card/50 backdrop-blur-sm border-2">
           <CardContent className="p-12 flex flex-col items-center space-y-8">
               
               {/* Task Selector */}
               <div className="w-full max-w-md">
                   <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                        <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder="Select a task to focus on..." />
                        </SelectTrigger>
                        <SelectContent>
                            {todoTasks.map(task => (
                                <SelectItem key={task.id} value={task.id} className="text-base">
                                    {task.title}
                                </SelectItem>
                            ))}
                            {todoTasks.length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">No pending tasks</div>
                            )}
                        </SelectContent>
                   </Select>
               </div>

               {/* Timer Display */}
               <div className="relative flex items-center justify-center">
                    {/* Simple SVG Circular Progress */}
                    <div className="relative w-72 h-72">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <circle
                                cx="144"
                                cy="144"
                                r="130"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 130}
                                strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
                                className={cn(
                                    "transition-all duration-1000 ease-linear",
                                    mode === "work" ? "text-primary" : "text-emerald-500"
                                )}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl font-mono font-bold tracking-tighter">
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground mt-2">
                                {mode === "work" ? "Focus Time" : "Break Time"}
                            </span>
                        </div>
                    </div>
               </div>

               {/* Controls */}
               <div className="flex items-center gap-4">
                   <Button 
                        size="icon-lg" 
                        className="h-14 w-14 rounded-full" 
                        onClick={toggleTimer}
                        variant={isActive ? "secondary" : "default"}
                   >
                       {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                   </Button>
                   <Button 
                        size="icon-lg" 
                        variant="ghost" 
                        className="h-14 w-14 rounded-full" 
                        onClick={resetTimer}
                   >
                       <RotateCcw className="h-6 w-6" />
                   </Button>
               </div>
           </CardContent>
       </Card>

       {/* Active Task Actions */}
       {selectedTaskId && (
           <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
               <span className="text-muted-foreground">Done with this task?</span>
               <Button onClick={handleTaskComplete} variant="outline" className="gap-2">
                   <CheckCircle2 className="h-4 w-4 text-green-500" />
                   Mark as Complete
               </Button>
           </div>
       )}
    </div>
  );
}
