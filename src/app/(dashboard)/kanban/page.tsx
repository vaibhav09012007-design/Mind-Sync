"use client";

import KanbanBoard from "@/components/kanban-board";
import { ViewSettings } from "@/components/kanban/view-settings";
import { Header } from "@/components/layout/Header";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function KanbanPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <Header
        title="Kanban Board"
        subtitle="Drag and drop tasks between columns to update their status"
      >
        <div className="flex items-center gap-2">
          <CreateTaskDialog>
            <Button variant="default" size="sm" className="gap-2">
              <Plus size={16} />
              Add Task
            </Button>
          </CreateTaskDialog>
          <ViewSettings />
        </div>
      </Header>
      <KanbanBoard />
    </div>
  );
}
