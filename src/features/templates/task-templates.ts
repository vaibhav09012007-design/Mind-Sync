"use server";

/**
 * Task Templates - Quick task creation from predefined templates
 */

import { db } from "@/db";
import { taskTemplates, tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import {
  ActionResult,
  createSuccessResult,
  createErrorResult,
} from "@/lib/errors";
import { revalidatePath } from "next/cache";

// Types
export interface TaskTemplateItem {
  title: string;
  description?: string;
  priority: "P0" | "P1" | "P2" | "P3";
  estimatedMinutes?: number;
  tags?: string[];
  relativeDeadline?: number; // days from now
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: TaskTemplateItem[];
  isPublic: boolean;
  createdAt: string;
}

// Default templates
export const defaultTemplates: Omit<TaskTemplate, "id" | "createdAt">[] = [
  {
    name: "Weekly Review",
    description: "End-of-week planning and review tasks",
    isPublic: true,
    tasks: [
      {
        title: "Review completed tasks this week",
        priority: "P2",
        estimatedMinutes: 15,
        tags: ["review"],
      },
      {
        title: "Update project documentation",
        priority: "P2",
        estimatedMinutes: 30,
        tags: ["documentation"],
      },
      {
        title: "Plan next week's priorities",
        priority: "P1",
        estimatedMinutes: 20,
        tags: ["planning"],
      },
      {
        title: "Clear inbox and organize emails",
        priority: "P2",
        estimatedMinutes: 20,
        tags: ["inbox"],
      },
    ],
  },
  {
    name: "Meeting Prep",
    description: "Standard meeting preparation checklist",
    isPublic: true,
    tasks: [
      {
        title: "Review previous meeting notes",
        priority: "P1",
        estimatedMinutes: 10,
        relativeDeadline: 0,
      },
      {
        title: "Prepare agenda items",
        priority: "P0",
        estimatedMinutes: 15,
        relativeDeadline: 0,
      },
      {
        title: "Gather relevant documents",
        priority: "P1",
        estimatedMinutes: 10,
        relativeDeadline: 0,
      },
    ],
  },
  {
    name: "Project Kickoff",
    description: "New project initialization tasks",
    isPublic: true,
    tasks: [
      {
        title: "Define project scope and objectives",
        priority: "P0",
        estimatedMinutes: 60,
        tags: ["planning"],
      },
      {
        title: "Identify stakeholders",
        priority: "P1",
        estimatedMinutes: 30,
        tags: ["stakeholders"],
      },
      {
        title: "Create project timeline",
        priority: "P1",
        estimatedMinutes: 45,
        tags: ["planning"],
      },
      {
        title: "Set up project communication channels",
        priority: "P2",
        estimatedMinutes: 20,
        tags: ["setup"],
      },
      {
        title: "Schedule kickoff meeting",
        priority: "P1",
        estimatedMinutes: 15,
        tags: ["meeting"],
      },
    ],
  },
  {
    name: "Daily Standup Prep",
    description: "Quick daily preparation",
    isPublic: true,
    tasks: [
      {
        title: "Review yesterday's tasks",
        priority: "P2",
        estimatedMinutes: 5,
      },
      {
        title: "Identify today's top 3 priorities",
        priority: "P1",
        estimatedMinutes: 5,
      },
      {
        title: "Note any blockers",
        priority: "P1",
        estimatedMinutes: 5,
      },
    ],
  },
];

/**
 * Get all templates (user's + public defaults)
 */
export async function getTemplates(): Promise<ActionResult<TaskTemplate[]>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const userTemplates = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.userId, userId));

    // Combine with defaults
    const allTemplates: TaskTemplate[] = [
      ...defaultTemplates.map((t, i) => ({
        ...t,
        id: `default-${i}`,
        createdAt: new Date().toISOString(),
      })),
      ...userTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        tasks: t.tasks as TaskTemplateItem[],
        isPublic: t.isPublic as boolean,
        createdAt: t.createdAt?.toISOString() || new Date().toISOString(),
      })),
    ];

    return createSuccessResult(allTemplates);
  } catch (error) {
    console.error("[Templates] Get error:", error);
    return createErrorResult(error);
  }
}

/**
 * Create a new template
 */
export async function createTemplate(data: {
  name: string;
  description?: string;
  tasks: TaskTemplateItem[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const id = uuidv4();

    await db.insert(taskTemplates).values({
      id,
      userId,
      name: data.name,
      description: data.description,
      tasks: data.tasks,
      isPublic: false,
    });

    revalidatePath("/dashboard");
    return createSuccessResult({ id });
  } catch (error) {
    console.error("[Templates] Create error:", error);
    return createErrorResult(error);
  }
}

/**
 * Apply a template - create tasks from template
 */
export async function applyTemplate(
  templateId: string
): Promise<ActionResult<{ created: number }>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Check if default template
    let templateTasks: TaskTemplateItem[];

    if (templateId.startsWith("default-")) {
      const index = parseInt(templateId.replace("default-", ""));
      templateTasks = defaultTemplates[index]?.tasks || [];
    } else {
      const [template] = await db
        .select()
        .from(taskTemplates)
        .where(and(eq(taskTemplates.id, templateId), eq(taskTemplates.userId, userId)));

      if (!template) throw new Error("Template not found");
      templateTasks = template.tasks as TaskTemplateItem[];
    }

    // Create tasks from template
    const now = new Date();
    let created = 0;

    for (const item of templateTasks) {
      const dueDate = item.relativeDeadline
        ? new Date(now.getTime() + item.relativeDeadline * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(tasks).values({
        id: uuidv4(),
        userId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        estimatedMinutes: item.estimatedMinutes,
        tags: item.tags,
        dueDate,
        status: "Todo",
      });

      created++;
    }

    revalidatePath("/dashboard");
    return createSuccessResult({ created });
  } catch (error) {
    console.error("[Templates] Apply error:", error);
    return createErrorResult(error);
  }
}

/**
 * Delete a user template
 */
export async function deleteTemplate(
  templateId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (templateId.startsWith("default-")) {
      throw new Error("Cannot delete default templates");
    }

    await db
      .delete(taskTemplates)
      .where(and(eq(taskTemplates.id, templateId), eq(taskTemplates.userId, userId)));

    revalidatePath("/dashboard");
    return createSuccessResult(undefined);
  } catch (error) {
    console.error("[Templates] Delete error:", error);
    return createErrorResult(error);
  }
}
