"use client";

import { NotesSidebar } from "@/features/notes/components/NotesSidebar";
import { TemplatePicker } from "@/components/notes/template-picker";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const currentNoteId = params.id as string;
  const [hydrated, setHydrated] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

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
