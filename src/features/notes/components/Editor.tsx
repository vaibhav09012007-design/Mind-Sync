"use client";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import Placeholder from "@tiptap/extension-placeholder";

import { Separator } from "@/components/ui/separator";

import { useState, useEffect } from "react";

import { useStore, Note } from "@/store/useStore";

import { toast } from "sonner";

import { format } from "date-fns";

import { Toggle } from "@/components/ui/toggle";

import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote } from "lucide-react";

export function Editor({ note, initialContent }: { note?: Note; initialContent?: string }) {
  const { updateNote, addTask } = useStore();

  const [title, setTitle] = useState(note?.title || "Untitled");

  // Debounce title updates

  useEffect(() => {
    if (note && title !== note.title) {
      const timer = setTimeout(() => {
        updateNote(note.id, { title, date: new Date().toISOString() });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [title, note, updateNote]);

  const editor = useEditor({
    extensions: [
      StarterKit,

      Placeholder.configure({
        placeholder: 'Start writing, or press "/" for commands...',
      }),
    ],

    immediatelyRender: false,

    content: note?.content || initialContent || "",

    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-slate max-w-none focus:outline-none min-h-[500px] py-4",
      },
    },

    onUpdate: ({ editor }) => {
      // Check for Action Items in the current line
      const { selection } = editor.state;
      const { $from } = selection;
      const currentLineText = $from.parent.textContent;

      // Simple regex for 'TODO:' at start of line
      const actionItemMatch = currentLineText.match(/^(TODO:|Action Item:)\s+(.+)$/i);

      if (actionItemMatch) {
        const taskTitle = actionItemMatch[2].trim();
        // Only toast if we haven't just toasted for this specific text (simple debounce/dedupe)
        // Storing last toasted in a ref would be better but for now rely on user interaction
        // Actually, to avoid spamming, we might want to check if the user is *still typing*.
        // But let's just use a toast with a unique ID based on the content so it updates/doesn't duplicate?
        // "sonner" handles duplicates if we give it an id.

        // Only show if length > 3 to avoid early triggers
        if (taskTitle.length > 3) {
          toast(`Action Item detected: "${taskTitle}"`, {
            id: `action-item-${taskTitle.slice(0, 10)}`, // dedup based on start of text
            action: {
              label: "Create Task",
              onClick: () => {
                addTask(taskTitle);
                toast.success("Task created!");
              },
            },
            duration: 5000,
          });
        }
      }

      // Save content to store if note exists
      if (note) {
        const content = editor.getHTML();

        const text = editor.getText();

        const preview = text.slice(0, 150) + (text.length > 150 ? "..." : "");

        updateNote(note.id, {
          content,

          preview,

          date: new Date().toISOString(),
        });
      }
    },
  });

  if (!editor) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <input
        type="text"
        placeholder="Untitled"
        className="placeholder:text-muted-foreground/40 mb-4 w-full border-none bg-transparent text-4xl font-bold focus:outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        readOnly={!note} // Only editable if it's a real note
      />

      <div className="text-muted-foreground mb-8 flex items-center gap-4 text-sm">
        <span>
          {note ? format(new Date(note.date), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
        </span>

        <Separator orientation="vertical" className="h-4" />

        <span>{note?.type || "Draft"} Note</span>
      </div>

      {/* Toolbar */}

      {note && (
        <div className="bg-background/95 sticky top-0 z-10 mb-4 flex items-center gap-1 border-b pb-2 backdrop-blur">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Toggle>
        </div>
      )}

      <div className="min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
