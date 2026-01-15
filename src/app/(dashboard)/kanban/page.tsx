"use client";

import KanbanBoard from "@/components/kanban-board";
import { ViewSettings } from "@/components/kanban/view-settings";
import { Header } from "@/components/layout/Header";

export default function KanbanPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <Header
        title="Kanban Board"
        subtitle="Drag and drop tasks between columns to update their status"
      >
        <ViewSettings />
      </Header>
      <KanbanBoard />
    </div>
  );
}
