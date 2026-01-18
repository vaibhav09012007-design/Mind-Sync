"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NOTE_TEMPLATES, NoteTemplate } from "@/lib/note-templates";
import { useStore, Note } from "@/store/useStore";
import {
  Users,
  UserCircle,
  Calendar,
  FileText,
  Lightbulb,
  File,
  LucideIcon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  UserCircle,
  Calendar,
  FileText,
  Lightbulb,
  File,
};

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePicker({ isOpen, onClose }: TemplatePickerProps) {
  const router = useRouter();
  const { addNote } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const createNoteFromTemplate = (template: NoteTemplate): Note => {
    return {
      id: uuidv4(),
      title: template.name === "Blank Note" ? "Untitled Note" : template.name,
      content: template.content,
      preview: template.content.slice(0, 100) || "No content yet...",
      date: new Date().toISOString(),
      tags: [],
      type: template.type,
    };
  };

  const handleQuickCreate = (template: NoteTemplate) => {
    const newNote = createNoteFromTemplate(template);
    addNote(newNote);
    onClose();
    router.push(`/notes/${newNote.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Choose a template to get started or create a blank note.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
          {NOTE_TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.icon] || File;
            const isSelected = selectedTemplate === template.id;

            return (
              <button
                key={template.id}
                onClick={() => handleQuickCreate(template)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:border-primary hover:bg-muted/50",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2",
                    template.type === "meeting"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-green-500/10 text-green-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
