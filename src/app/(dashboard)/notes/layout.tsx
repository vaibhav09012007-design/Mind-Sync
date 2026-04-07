"use client";

import { NotesSidebar } from "@/features/notes/components/NotesSidebar";
import { TemplatePicker } from "@/components/notes/template-picker";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const currentNoteId = params.id as string;
  const hydrated = useHydrated();
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const handleCreateNote = () => {
    setTemplatePickerOpen(true);
  };

  if (!hydrated) return null;

  return (
    <div className="flex h-full overflow-hidden">
      <NotesSidebar
        currentNoteId={currentNoteId}
        onSelectNote={(noteId) => router.push(`/notes/${noteId}`)}
        onCreateNote={handleCreateNote}
      />
      <div className="flex-1 overflow-auto">{children}</div>

      <TemplatePicker
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
      />
    </div>
  );
}
