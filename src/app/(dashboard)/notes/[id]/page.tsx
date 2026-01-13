"use client";

import { Editor } from "@/features/notes/components/Editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreHorizontal, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { notes, deleteNote } = useStore();
  
  // Find note in store
  const note = notes.find(n => n.id === id);

  // If not found, we could redirect or show error.
  // For now, let's just show loading or "New Note" state if undefined
  
  if (!note) {
      return <div className="p-8">Note not found. <Button onClick={() => router.push('/notes')}>Go Back</Button></div>;
  }

  const handleDelete = () => {
      if (confirm("Are you sure you want to delete this note?")) {
          deleteNote(id);
          router.push('/notes');
      }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
              Last edited {format(new Date(note.date), "MMM d, h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
                <Share className="mr-2 h-4 w-4" />
                Share
            </Button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Note
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <Editor note={note} />
      </div>
    </div>
  );
}
