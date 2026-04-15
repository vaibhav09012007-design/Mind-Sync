"use client";

/**
 * Workspace switcher dropdown for the sidebar
 * Allows users to switch between workspaces and create new ones
 */

import { useState, useEffect, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Plus, Settings, Users } from "lucide-react";
import {
  listUserWorkspaces,
  type WorkspaceWithRole,
} from "@/actions/workspaces";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const [workspaceList, setWorkspaceList] = useState<WorkspaceWithRole[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load workspaces on mount
  useEffect(() => {
    async function load() {
      const result = await listUserWorkspaces();
      if (result.success && result.data) {
        setWorkspaceList(result.data);
        // Default to first workspace (the auto-created personal workspace)
        if (result.data.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(result.data[0].id);
        }
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeWorkspace = workspaceList.find((w) => w.id === activeWorkspaceId);

  const handleSwitch = (workspaceId: string) => {
    startTransition(() => {
      setActiveWorkspaceId(workspaceId);
      // Reload the page to re-hydrate with new workspace data
      window.location.reload();
    });
  };

  const handleWorkspaceCreated = () => {
    setShowCreateDialog(false);
    // Reload workspaces
    startTransition(async () => {
      const result = await listUserWorkspaces();
      if (result.success && result.data) {
        setWorkspaceList(result.data);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium",
              className
            )}
            aria-label="Switch workspace"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">
                {activeWorkspace?.name ?? "Workspace"}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Your Workspaces
          </DropdownMenuLabel>

          {workspaceList.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSwitch(workspace.id)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                workspace.id === activeWorkspaceId && "bg-accent"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <div className="flex flex-col truncate">
                <span className="truncate text-sm">{workspace.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {workspace.role}
                </span>
              </div>
              {workspace.id === activeWorkspaceId && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {activeWorkspace?.role === "admin" && (
            <DropdownMenuItem
              onClick={() => setShowInviteDialog(true)}
              className="cursor-pointer"
            >
              <Users className="mr-2 h-4 w-4" />
              Invite Members
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleWorkspaceCreated}
      />

      {activeWorkspaceId && (
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          workspaceId={activeWorkspaceId}
        />
      )}
    </>
  );
}
