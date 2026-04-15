"use client";

/**
 * Individual comment display with avatar, timestamp, and delete action
 */

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import type { CommentWithUser } from "@/actions/comments";

interface CommentItemProps {
  comment: CommentWithUser;
  onDelete: (commentId: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { userId } = useAuth();
  const isOwn = comment.userId === userId;

  return (
    <div className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {getInitials(comment.userName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {comment.userName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })
              : "just now"}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>

      {isOwn && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(comment.id)}
          aria-label="Delete comment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
