"use client";

import { Button } from "@/components/ui/button";
import { Pause, Square, Play, Link as LinkIcon, FileText, Mic } from "lucide-react";
import { Editor } from "@/features/notes/components/Editor";
import { AudioVisualizer } from "@/features/meeting-mode/components/AudioVisualizer";
import { TranscriptionSidebar } from "@/features/meeting-mode/components/TranscriptionSidebar";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBrowserSpeechRecognition } from "@/hooks/useBrowserSpeechRecognition";
import { generateMeetingMinutes } from "./actions";
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvents, useNoteActions } from "@/store/selectors";
import { useStore, Note } from "@/store/useStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MeetingPage() {
  const router = useRouter();
  const events = useEvents();
  const { addNote, updateNote, deleteNote } = useNoteActions();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [linkedEventId, setLinkedEventId] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meetingMinutes, setMeetingMinutes] = useState<string | null>(null);
  const [isMinutesOpen, setIsMinutesOpen] = useState(false);

  // Live note for this meeting session
  const [meetingNoteId, setMeetingNoteId] = useState<string | null>(null);
  const meetingNoteRef = useRef<Note | null>(null);
  const hasStartedRef = useRef(false);
  const meetingEndedRef = useRef(false);

  // Use Browser Speech Recognition
  const { segments, interimResult, error, isSupported } = useBrowserSpeechRecognition(isRecording);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error);
      setIsRecording(false);
    }
  }, [error]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Keep meetingNoteRef in sync with store
  useEffect(() => {
    if (meetingNoteId) {
      const notes = useStore.getState().notes;
      const note = notes.find((n) => n.id === meetingNoteId);
      if (note) {
        meetingNoteRef.current = note;
      }
    }
  }, [meetingNoteId]);

  // Cleanup: delete empty draft note if user abandons a started meeting
  // Refs are used intentionally — cleanup only runs on unmount, refs hold latest values
  useEffect(() => {
    return () => {
      if (meetingNoteRef.current && hasStartedRef.current && !meetingEndedRef.current) {
        // User started recording but navigated away without ending — clean up draft
        const note = useStore.getState().notes.find((n) => n.id === meetingNoteRef.current!.id);
        const isEmpty = !note?.content || note.content === "" || note.content === "<h2>Meeting Notes</h2><p>Start recording to begin taking notes...</p>";
        if (isEmpty) {
          deleteNote(meetingNoteRef.current.id);
        }
      }
    };
  }, [deleteNote]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = useCallback(() => {
    if (!isSupported) {
      toast.error(
        "Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    // Create a persisted note for this meeting
    const noteId = crypto.randomUUID();
    const linkedEvent = linkedEventId ? events.find((e) => e.id === linkedEventId) : null;

    const newNote: Note = {
      id: noteId,
      title: linkedEvent ? `Meeting: ${linkedEvent.title}` : "Meeting Notes",
      preview: "Recording in progress...",
      content: "",
      date: new Date().toISOString(),
      tags: ["Meeting"],
      type: "meeting",
      eventId: linkedEventId || undefined,
    };

    setMeetingNoteId(noteId);
    meetingNoteRef.current = newNote;
    addNote(newNote);

    hasStartedRef.current = true;
    setHasStarted(true);
    setIsRecording(true);
    toast.success("Recording started! Speak clearly into your microphone.");
  }, [isSupported, linkedEventId, events, addNote]);

  const handleEndMeeting = useCallback(() => {
    meetingEndedRef.current = true;
    setIsRecording(false);

    // Compile transcript to HTML
    const transcriptHTML = segments
      .map((s) => `<p><strong>${s.speaker} (${s.time}):</strong> ${s.text}</p>`)
      .join("");

    // Get the current note content from the store (editor auto-saves to store)
    const currentNote = meetingNoteId
      ? useStore.getState().notes.find((n) => n.id === meetingNoteId)
      : null;
    const editorContent = currentNote?.content || "";

    // Build comprehensive note content
    let finalContent = "";

    // 1. AI-generated minutes (if any)
    if (meetingMinutes) {
      finalContent += `<h2>Meeting Minutes</h2>${meetingMinutes}<hr/>`;
    }

    // 2. User-authored editor notes
    if (editorContent) {
      finalContent += `<h2>Notes</h2>${editorContent}<hr/>`;
    }

    // 3. Full transcript
    if (transcriptHTML) {
      finalContent += `<h2>Transcript</h2>${transcriptHTML}`;
    }

    const preview = meetingMinutes
      ? "Minutes generated. " + (segments.length > 0 ? segments[0].text.slice(0, 50) + "..." : "")
      : segments.length > 0
        ? segments[0].text.slice(0, 100) + "..."
        : editorContent
          ? editorContent.replace(/<[^>]*>/g, "").slice(0, 100) + "..."
          : "No content recorded.";

    if (meetingNoteId) {
      // Update the existing live note
      updateNote(meetingNoteId, {
        title: meetingMinutes ? "Meeting Minutes & Notes" : "Meeting Notes",
        preview,
        content: finalContent || "No content recorded.",
        date: new Date().toISOString(),
        tags: ["Meeting", "Transcript"],
        type: "meeting",
        eventId: linkedEventId || undefined,
      });
      router.push(`/notes/${meetingNoteId}`);
    } else {
      // Fallback: create a new note if somehow no live note exists
      const newId = crypto.randomUUID();
      addNote({
        id: newId,
        title: meetingMinutes ? "Meeting Minutes & Notes" : "Meeting Notes",
        preview,
        content: finalContent || "No content recorded.",
        date: new Date().toISOString(),
        tags: ["Meeting", "Transcript"],
        type: "meeting",
        eventId: linkedEventId || undefined,
      });
      router.push(`/notes/${newId}`);
    }
  }, [segments, meetingMinutes, meetingNoteId, linkedEventId, updateNote, addNote, router]);

  const handleGenerateMinutes = async () => {
    if (segments.length === 0) {
      toast.error("No transcript available to summarize.");
      return;
    }

    setIsGenerating(true);
    toast.info("Generating meeting minutes... This may take a moment.");

    const transcriptText = segments.map((s) => `${s.speaker} (${s.time}): ${s.text}`).join("\n");

    const result = await generateMeetingMinutes(transcriptText);

    setIsGenerating(false);

    if (result.success && result.data) {
      setMeetingMinutes(result.data);
      setIsMinutesOpen(true);
      toast.success("Meeting minutes generated successfully!");
    } else {
      toast.error(result.error || "Failed to generate minutes.");
    }
  };

  // Get the live note object from the store for the Editor
  const liveNote = meetingNoteId
    ? useStore.getState().notes.find((n) => n.id === meetingNoteId) || null
    : null;

  return (
    <div className="relative -m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main Editor Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Control Bar */}
        <div className="bg-background flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-2 overflow-hidden lg:gap-4">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">Active Meeting</span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatTime(duration)}
              </span>
            </div>
            <div className="hidden sm:block">
              <AudioVisualizer isActive={isRecording} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Transcript Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <FileText className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[85vw] p-0 sm:w-100">
                <SheetHeader className="sr-only">
                  <SheetTitle>Meeting Transcript</SheetTitle>
                  <SheetDescription>
                    Real-time transcription of the ongoing meeting
                  </SheetDescription>
                </SheetHeader>
                <TranscriptionSidebar segments={segments} interimResult={interimResult} />
              </SheetContent>
            </Sheet>

            {/* Link to Calendar Event */}
            <div className="hidden md:block">
              <Select value={linkedEventId} onValueChange={setLinkedEventId}>
                <SelectTrigger className="h-8 w-45 text-xs">
                  <LinkIcon className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="Link to Event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                  {events.length === 0 && (
                    <div className="text-muted-foreground p-2 text-xs">No events found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {!hasStarted ? (
              <Button variant="default" size="sm" onClick={handleStartRecording} className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Start Recording</span>
                <span className="sm:hidden">Start</span>
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setIsRecording(!isRecording)}>
                {isRecording ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}

            {/* Generate Minutes Button */}
            {hasStarted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateMinutes}
                disabled={isGenerating || segments.length === 0}
                className="hidden sm:flex"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "AI Summary"}
              </Button>
            )}

            <Button variant="destructive" size="sm" onClick={handleEndMeeting}>
              <Square className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">End Meeting</span>
              <span className="sm:hidden">End</span>
            </Button>
          </div>
        </div>

        <div className="bg-background flex-1 overflow-auto">
          {liveNote ? (
            <Editor note={liveNote} />
          ) : (
            <Editor initialContent="<h2>Meeting Notes</h2><p>Start recording to begin taking notes...</p>" />
          )}
        </div>
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden h-full w-87.5 border-l lg:block">
        <TranscriptionSidebar segments={segments} interimResult={interimResult} />
      </div>

      <Dialog open={isMinutesOpen} onOpenChange={setIsMinutesOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Minutes</DialogTitle>
            <DialogDescription>AI-generated summary and action items.</DialogDescription>
          </DialogHeader>
          <div
            className="prose dark:prose-invert mt-4"
            dangerouslySetInnerHTML={{ __html: meetingMinutes || "" }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
