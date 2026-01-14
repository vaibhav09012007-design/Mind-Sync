"use server";

import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getGoals(userId: string) {
  if (!userId) return [];
  return await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")));
}

export async function createGoal(data: {
  userId: string;
  title: string;
  targetValue: number;
  metric: "hours" | "tasks" | "streak";
  period: "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
}) {
  await db.insert(goals).values(data);
  revalidatePath("/dashboard"); // Adjust path as needed
}

export async function updateGoalProgress(id: string, currentValue: number) {
  await db.update(goals).set({ currentValue }).where(eq(goals.id, id));
  revalidatePath("/dashboard");
}

export async function deleteGoal(id: string) {
  await db.delete(goals).where(eq(goals.id, id));
  revalidatePath("/dashboard");
}
