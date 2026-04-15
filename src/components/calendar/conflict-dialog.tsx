"use client";

/**
 * Conflict resolution dialog for calendar events
 * Shows conflicting events and suggests alternative time slots
 */

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  suggestAlternativeSlots,
  type ConflictInfo,
  type AlternativeSlot,
} from "@/actions/ai-schedule-conflict";
import { format } from "date-fns";

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictInfo;
  proposedTitle: string;
  proposedStart: string;
  proposedEnd: string;
  onAcceptAlternative: (slot: AlternativeSlot) => void;
  onForceCreate: () => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflict,
  proposedTitle,
  proposedStart,
  proposedEnd,
  onAcceptAlternative,
  onForceCreate,
}: ConflictDialogProps) {
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [isLoading, startLoading] = useTransition();

  useEffect(() => {
    if (open && conflict.hasConflict) {
      startLoading(async () => {
        const durationMs =
          new Date(proposedEnd).getTime() - new Date(proposedStart).getTime();
        const durationMin = Math.round(durationMs / 60000);

        const result = await suggestAlternativeSlots(
          proposedStart,
          durationMin
        );
        if (result.success && result.data) {
          setAlternatives(result.data);
        }
      });
    }
  }, [open, conflict.hasConflict, proposedStart, proposedEnd]);

  const formatTime = (iso: string) => {
    try {
      return format(new Date(iso), "h:mm a");
    } catch {
      return iso;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">Schedule Conflict</DialogTitle>
          <DialogDescription className="text-center">
            &quot;{proposedTitle}&quot; overlaps with{" "}
            {conflict.conflictingEvents.length} existing event
            {conflict.conflictingEvents.length > 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        {/* Conflicting Events */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Conflicts with:
          </p>
          {conflict.conflictingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
            >
              <Calendar className="h-4 w-4 text-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.start)} – {formatTime(event.end)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Alternative Slots */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested alternatives:
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Finding free slots...
              </span>
            </div>
          ) : alternatives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No free slots available today.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {alternatives.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => onAcceptAlternative(slot)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent hover:border-primary/30 group"
                >
                  <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{slot.label}</p>
                    {slot.reason && (
                      <p className="text-xs text-muted-foreground">
                        {slot.reason}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onForceCreate}
            className="w-full sm:w-auto"
          >
            Keep Anyway
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
