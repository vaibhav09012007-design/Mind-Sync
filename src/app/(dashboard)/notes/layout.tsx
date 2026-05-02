"use client";

import { NotesSidebar } from "@/features/notes/components/NotesSidebar";
import { TemplatePicker } from "@/components/notes/template-picker";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const currentNoteId = params.id as string;
  const hydrated = useHydrated();
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleCreateNote = () => {
    setTemplatePickerOpen(true);
  };

  if (!hydrated) return null;

  // On mobile: 
  // - If a note is selected, show only the editor (children)
  // - If no note is selected, show only the sidebar
  const showSidebar = !isMobile || !currentNoteId;
  const showEditor = !isMobile || !!currentNoteId;

  return (
    <div className="flex h-full overflow-hidden">
      {showSidebar && (
        <div className={cn(
          "h-full overflow-hidden",
          isMobile ? "w-full" : "w-80"
        )}>
          <NotesSidebar
            currentNoteId={currentNoteId}
            onSelectNote={(noteId) => router.push(`/notes/${noteId}`)}
            onCreateNote={handleCreateNote}
          />
        </div>
      )}
      
      {showEditor && (
        <div className="flex-1 overflow-auto h-full">
          {children}
        </div>
      )}

      <TemplatePicker
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
      />
    </div>
  );
}
