"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";

import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Note } from "@/store/useStore";
import { useNoteActions, useTaskActions } from "@/store/selectors";
import { toast } from "sonner";
import { format } from "date-fns";
import { Toggle } from "@/components/ui/toggle";
import { analyzeSentiment } from "@/features/ai/advanced-ai";
import { Badge } from "@/components/ui/badge";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Sparkles } from "lucide-react";

export function Editor({ note, initialContent }: { note?: Note; initialContent?: string }) {
  const { updateNote } = useNoteActions();
  const { addTask } = useTaskActions();

  const [title, setTitle] = useState(note?.title || "Untitled");
  const [sentiment, setSentiment] = useState<"positive" | "neutral" | "negative" | null>(
    note?.sentiment || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Set up Yjs document and PartyKit provider
  const { ydoc, provider } = useMemo(() => {
    if (!note?.id) return { ydoc: null, provider: null };
    
    const ydoc = new Y.Doc();
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
    const provider = new YPartyKitProvider(host, `note-${note.id}`, ydoc);
    
    return { ydoc, provider };
  }, [note?.id]);

  useEffect(() => {
    return () => {
      provider?.destroy();
    };
  }, [provider]);

  // Debounce title updates
  useEffect(() => {
    if (note && title !== note.title) {
      const timer = setTimeout(() => {
        updateNote(note.id, { title, date: new Date().toISOString() });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [title, note, updateNote]);

  const runSentimentAnalysis = useCallback(
    async (text: string) => {
      if (!note || note.type !== "journal") return;
      setIsAnalyzing(true);
      try {
        const result = await analyzeSentiment(text);
        if (result.success) {
          setSentiment(result.data.overall);
        }
      } catch (error) {
        console.error("Sentiment analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [note]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History is handled by Yjs
      }),
      Placeholder.configure({
        placeholder: 'Start writing, or press "/" for commands...',
      }),
      ...(ydoc ? [Collaboration.configure({ document: ydoc })] : []),
    ],

    immediatelyRender: false,
    content: ydoc ? undefined : note?.content || initialContent || "",

    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-slate max-w-none focus:outline-none min-h-[500px] py-4",
      },
    },

    onUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const { $from } = selection;
      const currentLineText = $from.parent.textContent;

      const actionItemMatch = currentLineText.match(/^(TODO:|Action Item:)\s+(.+)$/i);

      if (actionItemMatch) {
        const taskTitle = actionItemMatch[2].trim();
        if (taskTitle.length > 3) {
          toast(`Action Item detected: "${taskTitle}"`, {
            id: `action-item-${taskTitle.slice(0, 10)}`,
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

      if (note) {
        const content = editor.getHTML();
        const text = editor.getText();
        const preview = text.slice(0, 150) + (text.length > 150 ? "..." : "");

        if (note.type === "journal" && text.length > 20 && Math.random() > 0.7) {
           runSentimentAnalysis(text);
        }

        updateNote(note.id, {
          content,
          preview,
          date: new Date().toISOString(),
          sentiment: sentiment || undefined,
        });
      }
    },
  });

  if (!editor) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <input
            type="text"
            placeholder="Untitled"
            className="placeholder:text-muted-foreground/40 w-full border-none bg-transparent text-4xl font-bold focus:outline-none flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!note}
        />
        {note?.type === "journal" && (
            <div className="flex items-center gap-2">
                {isAnalyzing && <Sparkles className="h-4 w-4 animate-spin text-primary" />}
                {sentiment && (
                    <Badge variant="outline" className={
                        sentiment === "positive" ? "border-green-500 text-green-500 bg-green-500/10" :
                        sentiment === "negative" ? "border-red-500 text-red-500 bg-red-500/10" :
                        "border-blue-500 text-blue-500 bg-blue-500/10"
                    }>
                        {sentiment === "positive" ? "🌟 Positive" :
                         sentiment === "negative" ? "🌧️ Negative" :
                         "😐 Neutral"}
                    </Badge>
                )}
            </div>
        )}
      </div>

      <div className="text-muted-foreground mb-8 flex items-center gap-4 text-sm">
        <span>
          {note ? format(new Date(note.date), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span>{note?.type || "Draft"} Note</span>
      </div>

      {note && (
        <div className="bg-background/95 sticky top-0 z-10 mb-4 flex items-center gap-1 border-b pb-2 backdrop-blur">
          <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Toggle size="sm" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
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
