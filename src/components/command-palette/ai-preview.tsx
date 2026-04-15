"use client";

/**
 * AI intent preview card for the command palette
 * Shows parsed intent before user confirms creation
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckSquare,
  Clock,
  Tag,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type { ParsedIntent } from "@/actions/ai-parse";
import { format } from "date-fns";

interface AIPreviewProps {
  intent: ParsedIntent;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return iso;
  }
}

const priorityColors: Record<string, string> = {
  P0: "bg-red-500/10 text-red-600 border-red-500/20",
  P1: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  P2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  P3: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export function AIPreview({ intent, onConfirm, onCancel, isLoading }: AIPreviewProps) {
  const isEvent = intent.action === "CREATE_EVENT";
  const Icon = isEvent ? Calendar : CheckSquare;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            {isEvent ? "Create Event" : "Create Task"}
          </p>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {intent.source === "ai" ? "AI parsed" : "Local parser"} •{" "}
              {Math.round(intent.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{intent.title}</p>

        {intent.description && (
          <p className="text-xs text-muted-foreground">{intent.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {intent.priority && (
            <Badge
              variant="outline"
              className={priorityColors[intent.priority] ?? ""}
            >
              {intent.priority}
            </Badge>
          )}

          {intent.dueDate && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(intent.dueDate)}
            </Badge>
          )}

          {isEvent && intent.startTime && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateTime(intent.startTime)}
              {intent.endTime && ` – ${format(new Date(intent.endTime), "h:mm a")}`}
            </Badge>
          )}

          {intent.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>

        {intent.confidence < 0.5 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            Low confidence — you may want to edit before confirming
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Creating..." : "Confirm"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
