"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHabitSchema, type CreateHabitInput } from "@/lib/validation";
import { createHabit, updateHabit } from "@/actions/habits";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { v4 as uuidv4 } from "uuid";

interface HabitFormProps {
  initialData?: Partial<CreateHabitInput> & { id: string; title: string };
  onSuccess?: () => void;
}

export function HabitForm({ initialData, onSuccess }: HabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(createHabitSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          frequency: initialData.frequency || "daily",
          targetCount: initialData.targetCount || 1,
          timeOfDay: initialData.timeOfDay || "anytime",
        }
      : {
          id: uuidv4(),
          title: "",
          description: "",
          frequency: "daily",
          targetCount: 1,
          timeOfDay: "anytime",
          reminderTime: "",
        },
  });

  async function onSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true);
    try {
      const payload = data as unknown as CreateHabitInput;
      let result;
      if (isEditing) {
        result = await updateHabit({ ...payload, id: initialData.id });
      } else {
        result = await createHabit(payload);
      }

      if (result.success) {
        toast.success(isEditing ? "Habit updated" : "Habit created");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save habit");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Read 30 minutes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Why do you want to build this habit?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    {/* Custom frequency implementation omitted for MVP simplicity */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeOfDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time of Day</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="anytime">Anytime</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="reminderTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reminder Time (Optional)</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} variant="gradient">
            {isSubmitting ? "Saving..." : isEditing ? "Update Habit" : "Create Habit"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
