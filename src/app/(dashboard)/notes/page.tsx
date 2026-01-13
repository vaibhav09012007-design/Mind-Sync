"use client";

import { NoteCard } from "@/features/notes/components/NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";

export default function NotesPage() {
  const router = useRouter();
  const { notes, addNote } = useStore();
  
  // Hydration safety
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true) }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "meeting" | "personal">("all");

  const handleNewNote = () => {
      const newId = Math.random().toString(36).substr(2, 9);
      // Initialize note in store so it exists when we navigate
      addNote({
          id: newId,
          title: "Untitled Note",
          preview: "No content yet...",
          content: "",
          date: new Date().toISOString(),
          tags: ["Personal"],
          type: "personal"
      });
      router.push(`/notes/${newId}`);
  };

  const toggleFilter = () => {
      if (filterType === "all") setFilterType("meeting");
      else if (filterType === "meeting") setFilterType("personal");
      else setFilterType("all");
  };

  const filteredNotes = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            note.preview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" || note.type === filterType;
      return matchesSearch && matchesFilter;
  });

  if (!hydrated) return null;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Capture thoughts, meetings, and ideas.</p>
        </div>
        <Button onClick={handleNewNote}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search" 
                placeholder="Search notes..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <Button 
            variant={filterType === "all" ? "outline" : "secondary"} 
            size="icon"
            onClick={toggleFilter}
            title={`Filter: ${filterType}`}
        >
            <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNotes.map((note) => (
            <NoteCard 
                key={note.id} 
                {...note} 
                date={format(new Date(note.date), "MMM d, yyyy")}
            />
        ))}
        {filteredNotes.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No notes found.
            </div>
        )}
      </div>
    </div>
  );
}
