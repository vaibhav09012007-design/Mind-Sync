"use client";

import { RefreshCw, Check, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarSync } from "@/hooks/use-calendar-sync";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export function CalendarSyncStatus() {
  const { syncState, fullSync } = useCalendarSync();

  const getStatusIcon = () => {
    switch (syncState.status) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return syncState.lastSynced ? (
          <Cloud className="text-muted-foreground h-4 w-4" />
        ) : (
          <CloudOff className="text-muted-foreground h-4 w-4" />
        );
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case "syncing":
        return "Syncing...";
      case "success":
        return syncState.lastSynced
          ? `Synced ${formatDistanceToNow(syncState.lastSynced, { addSuffix: true })}`
          : "Synced";
      case "error":
        return syncState.error || "Sync failed";
      default:
        return syncState.lastSynced
          ? `Last sync: ${formatDistanceToNow(syncState.lastSynced, { addSuffix: true })}`
          : "Not synced yet";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={fullSync}
            disabled={syncState.status === "syncing"}
            className={cn("gap-2", syncState.status === "error" && "text-red-500")}
          >
            {getStatusIcon()}
            <span className="hidden text-xs sm:inline">
              {syncState.status === "syncing" ? "Syncing" : "Sync"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {syncState.pendingChanges > 0 && (
            <p className="text-xs text-amber-400">{syncState.pendingChanges} pending changes</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
