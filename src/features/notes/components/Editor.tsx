"use client";

import { useEditor, EditorContent } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';

import Placeholder from '@tiptap/extension-placeholder';

import { Separator } from "@/components/ui/separator";

import { useState, useEffect } from "react";

import { useStore, Note } from "@/store/useStore";

import { format } from "date-fns";

import { Toggle } from "@/components/ui/toggle";

import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote } from "lucide-react";



export function Editor({ note, initialContent }: { note?: Note; initialContent?: string }) {

  const { updateNote } = useStore();

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

        class: 'prose dark:prose-invert prose-slate max-w-none focus:outline-none min-h-[500px] py-4',

      },

    },

    onUpdate: ({ editor }) => {

        // Save content to store if note exists

        if (note) {

            const content = editor.getHTML();

            const text = editor.getText();

            const preview = text.slice(0, 150) + (text.length > 150 ? "..." : "");

            

            updateNote(note.id, { 

                content, 

                preview, 

                date: new Date().toISOString() 

            });

        }

    }

  });



  if (!editor) return null;



  return (

    <div className="max-w-3xl mx-auto py-8 px-6">

      <input

        type="text"

        placeholder="Untitled"

        className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/40 mb-4"

        value={title}

        onChange={(e) => setTitle(e.target.value)}

        readOnly={!note} // Only editable if it's a real note

      />

      <div className="text-sm text-muted-foreground mb-8 flex items-center gap-4">

        <span>{note ? format(new Date(note.date), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}</span>

        <Separator orientation="vertical" className="h-4" />

        <span>{note?.type || "Draft"} Note</span>

      </div>

      

      {/* Toolbar */}

      {note && (

          <div className="flex items-center gap-1 border-b pb-2 mb-4 sticky top-0 bg-background/95 backdrop-blur z-10">

            <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>

                <Bold className="h-4 w-4" />

            </Toggle>

            <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>

                <Italic className="h-4 w-4" />

            </Toggle>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>

                <Heading1 className="h-4 w-4" />

            </Toggle>

            <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>

                <Heading2 className="h-4 w-4" />

            </Toggle>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>

                <List className="h-4 w-4" />

            </Toggle>

            <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>

                <ListOrdered className="h-4 w-4" />

            </Toggle>

            <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>

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


