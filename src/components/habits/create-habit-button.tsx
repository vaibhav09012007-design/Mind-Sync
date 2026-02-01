"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HabitForm } from "./habit-form";

export function CreateHabitButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-glow-sm hover:shadow-glow-md transition-all">
          <Plus className="h-4 w-4" /> New Habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
          <DialogDescription>
            Start small. Consistency is key.
          </DialogDescription>
        </DialogHeader>
        <HabitForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
