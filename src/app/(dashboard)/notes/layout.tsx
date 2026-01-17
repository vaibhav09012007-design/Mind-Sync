"use client";

import { NotesSidebar } from "@/features/notes/components/NotesSidebar";
import { useStore } from "@/store/useStore";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { addNote } = useStore();
  const params = useParams();
  const currentNoteId = params.id as string;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const handleCreateNote = () => {
    const newId = crypto.randomUUID();
    addNote({
      id: newId,
      title: "Untitled Note",
      preview: "No content yet...",
      content: "",
      date: new Date().toISOString(),
      tags: ["Personal"],
      type: "personal",
    });
    router.push(`/notes/${newId}`);
  };

  if (!hydrated) return null;

  return (
    <div className="bg-background flex h-full overflow-hidden">
      <NotesSidebar
        currentNoteId={currentNoteId}
        onSelectNote={(noteId) => router.push(`/notes/${noteId}`)}
        onCreateNote={handleCreateNote}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
