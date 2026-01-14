"use client";

import KanbanBoard from "@/components/kanban-board";

export default function KanbanPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        <p className="text-muted-foreground">
          Drag and drop tasks between columns to update their status
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
