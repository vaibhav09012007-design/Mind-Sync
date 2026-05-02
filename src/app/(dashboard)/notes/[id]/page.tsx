"use client";

import dynamic from "next/dynamic";

// Lazy-load the Tiptap editor — only loads when user opens a note
const Editor = dynamic(
  () => import("@/features/notes/components/Editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-muted-foreground animate-pulse">Loading editor...</div>
      </div>
    ),
  }
);
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Share, Trash2, Download, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useNotes, useNoteActions } from "@/store/selectors";
import { format } from "date-fns";
import { exportNoteToMarkdown } from "@/lib/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const notes = useNotes();
  const { deleteNote } = useNoteActions();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Find note in store
  const note = notes.find((n) => n.id === id);

  // If not found, we could redirect or show error.
  // For now, let's just show loading or "New Note" state if undefined

  if (!note) {
    return (
      <div className="p-8">
        Note not found. <Button onClick={() => router.push("/notes")}>Go Back</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id);
      router.push("/notes");
      router.refresh(); // Ensure server components re-fetch
    }
  };

  return (
    <div className="bg-background flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-3 sm:px-6 py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/notes")}
              className="mr-1 h-8 w-8"
              aria-label="Back to notes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <span className="text-muted-foreground text-xs sm:text-sm truncate">
            {isMobile ? "Edited " : "Last edited "}
            {format(new Date(note.date), isMobile ? "MMM d" : "MMM d, h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2 sm:h-9 sm:px-4">
            <Share className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Note actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportNoteToMarkdown(note)}>
                <Download className="mr-2 h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <Editor note={note} key={note.id} />
      </div>
    </div>
  );
}
