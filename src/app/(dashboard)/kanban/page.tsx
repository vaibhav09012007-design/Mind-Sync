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
import { GlassCard } from "@/components/ui/card";

// Dynamic import for heavy Kanban component with loading skeleton
const KanbanBoard = dynamic(() => import("@/components/kanban-board"), {
  loading: () => <KanbanBoardSkeleton />,
  ssr: false,
});

export default function KanbanPage() {
  const { tasks } = useStore();

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex-none mb-4">
        <Header
          title="Kanban Board"
          subtitle="Drag and drop tasks between columns to update their status"
        >
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm">
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
              <Button variant="gradient" size="sm" className="gap-2 shadow-lg shadow-purple-500/20">
                <Plus size={16} />
                Add Task
              </Button>
            </CreateTaskDialog>
            <ViewSettings />
          </div>
        </Header>
      </div>
      
      <GlassCard className="flex-1 overflow-hidden p-0 border-dashed border-2 bg-transparent shadow-none" hover="none">
        <KanbanBoard />
      </GlassCard>
    </div>
  );
}
