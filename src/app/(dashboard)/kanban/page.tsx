"use client";

import dynamic from "next/dynamic";
import { ViewSettings } from "@/components/kanban/view-settings";
import { Header } from "@/components/layout/Header";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { KanbanBoardSkeleton } from "@/components/ui/skeleton";
import { Plus, Download } from "lucide-react";
import { useStore } from "@/store/useStore";
import { exportTasksToCSV, exportTasksToJSON } from "@/lib/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dynamic import for heavy Kanban component with loading skeleton
const KanbanBoard = dynamic(() => import("@/components/kanban-board"), {
  loading: () => <KanbanBoardSkeleton />,
  ssr: false,
});

export default function KanbanPage() {
  const { tasks } = useStore();

  return (
    <div className="h-full overflow-auto p-6">
      <Header
        title="Kanban Board"
        subtitle="Drag and drop tasks between columns to update their status"
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportTasksToCSV(tasks)}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTasksToJSON(tasks)}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
