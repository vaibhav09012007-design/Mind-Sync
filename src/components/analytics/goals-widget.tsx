"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

// ... (existing imports)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createGoal, updateGoalProgress, deleteGoal } from "@/actions/goals";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { addDays, addMonths, startOfDay } from "date-fns";

// Assuming we pass goals as props or fetch them. For simplicity in this demo, let's accept them as props.
// Ideally, the parent component fetches them via the server action.

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  metric: "hours" | "tasks" | "streak";
  period: "weekly" | "monthly";
}

interface GoalsWidgetProps {
  initialGoals: Goal[];
  userId: string;
  className?: string;
}

export function GoalsWidget({ initialGoals, userId, className }: GoalsWidgetProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("10");
  const [metric, setMetric] = useState<"hours" | "tasks" | "streak">("hours");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const end = period === "weekly" ? addDays(now, 7) : addMonths(now, 1);

      await createGoal({
        userId,
        title,
        targetValue: parseInt(target),
        metric,
        period,
        startDate: startOfDay(now),
        endDate: end,
      });

      toast.success("Goal created!");
      setIsOpen(false);
      // In a real app with strict RSC, we'd rely on revalidatePath,
      // but here we might need to manually refresh or trust the parent re-renders.
      // For this UX, let's assume parent will re-render or we optimistically update if we had the full object.
      // Since we don't have the ID back easily without a more complex return from action, we'll force a reload or wait for revalidation.
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("Goal deleted");
    } catch (e) {
      toast.error("Failed to delete goal");
    }
  };

  return (
    <Card className={cn("h-full min-h-[400px]", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>My Goals</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Deep Work Week"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select value={metric} onValueChange={(v: "hours" | "tasks" | "streak") => setMetric(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                      <SelectItem value="streak">Streak Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v: "weekly" | "monthly") => setPeriod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No goals set. Challenge yourself!
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{goal.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {goal.currentValue} / {goal.targetValue} {goal.metric}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-4 w-4"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
