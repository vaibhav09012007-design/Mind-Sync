"use client";

import { StickyNote } from "lucide-react";

export default function NotesIndexPage() {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <StickyNote className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Select a note to view</h2>
      <p className="max-w-xs text-center text-sm">
        Choose a note from the sidebar or create a new one to get started.
      </p>
    </div>
  );
}
