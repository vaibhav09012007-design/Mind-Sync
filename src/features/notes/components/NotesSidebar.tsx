import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Folder, Tag, Hash, Calendar, StickyNote, Trash2 } from "lucide-react";
import { useStore, Note } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";

interface NotesSidebarProps {
  currentNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function NotesSidebar({ currentNoteId, onSelectNote, onCreateNote }: NotesSidebarProps) {
  const { notes, deleteNote } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "meeting" | "personal">("all");

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.preview.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || note.type === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-muted/10 flex h-full w-80 flex-col border-r">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <StickyNote className="h-5 w-5" />
            Notes
          </h2>
          <Button onClick={onCreateNote} size="icon" variant="default" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-1 text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === "meeting" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("meeting")}
            className="flex-1 text-xs"
          >
            Meetings
          </Button>
          <Button
            variant={filter === "personal" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("personal")}
            className="flex-1 text-xs"
          >
            Personal
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 pb-4">
          {filteredNotes.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">No notes found</div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  "hover:bg-accent group relative cursor-pointer rounded-lg border p-3 transition-colors",
                  currentNoteId === note.id
                    ? "bg-accent border-primary/50 shadow-sm"
                    : "bg-card hover:border-border border-transparent"
                )}
              >
                <div className="mb-1 flex items-start justify-between">
                  <h3
                    className={cn(
                      "group-hover:text-primary line-clamp-1 text-sm font-medium transition-colors",
                      currentNoteId === note.id && "text-primary"
                    )}
                  >
                    {note.title || "Untitled"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground ml-2 text-[10px] whitespace-nowrap">
                      {format(new Date(note.date), "MMM d")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Optimistic delete via store
                        deleteNote(note.id);
                      }}
                      title="Delete Note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                  {note.preview || "No content"}
                </p>

                {/* Mini Badges */}
                <div className="flex flex-wrap gap-1">
                  {note.type === "meeting" && (
                    <div className="flex items-center gap-1 rounded-sm bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-500">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>Meeting</span>
                    </div>
                  )}
                  {note.tags?.slice(0, 2).map((tag) => (
                    <div
                      key={tag}
                      className="bg-muted text-muted-foreground flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px]"
                    >
                      <Hash className="h-2.5 w-2.5" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
