"use client";

/**
 * Threaded comment list with input form
 * Reusable for both task and note entities
 */

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import {
  getComments,
  createComment,
  deleteComment,
  type CommentWithUser,
} from "@/actions/comments";
import { CommentItem } from "./comment-item";
import { toast } from "sonner";

interface CommentThreadProps {
  entityType: "task" | "note";
  entityId: string;
  className?: string;
}

export function CommentThread({
  entityType,
  entityId,
  className,
}: CommentThreadProps) {
  const [commentList, setCommentList] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load comments on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const result = await getComments(entityType, entityId);
      if (result.success && result.data) {
        setCommentList(result.data);
      }
      setIsLoading(false);
    }
    load();
  }, [entityType, entityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const content = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      const result = await createComment(entityType, entityId, content);
      if (result.success && result.data) {
        setCommentList((prev) => [result.data!, ...prev]);
      } else {
        toast.error("Failed to add comment");
        setNewComment(content); // Restore on failure
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (result.success) {
        setCommentList((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        toast.error("Failed to delete comment");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">
          Comments{" "}
          {commentList.length > 0 && (
            <span className="text-muted-foreground">({commentList.length})</span>
          )}
        </h3>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (Ctrl+Enter to send)"
            className="min-h-[60px] resize-none pr-12 text-sm"
            disabled={isPending}
            maxLength={2000}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-7 w-7 text-primary hover:text-primary/80"
            disabled={isPending || !newComment.trim()}
            aria-label="Send comment"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Comment List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : commentList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {commentList.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
