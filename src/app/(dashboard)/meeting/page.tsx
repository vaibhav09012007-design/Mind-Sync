"use client";

import { Button } from "@/components/ui/button";
import { Pause, Square, Play, Link as LinkIcon, FileText, Mic } from "lucide-react";
import { Editor } from "@/features/notes/components/Editor";
import { AudioVisualizer } from "@/features/meeting-mode/components/AudioVisualizer";
import { TranscriptionSidebar } from "@/features/meeting-mode/components/TranscriptionSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrowserSpeechRecognition } from "@/hooks/useBrowserSpeechRecognition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function MeetingPage() {
  const router = useRouter();
  const { events, addNote } = useStore();
  const [isRecording, setIsRecording] = useState(false); // Start paused so user can grant permission
  const [duration, setDuration] = useState(0);
  const [linkedEventId, setLinkedEventId] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);

  // Use Browser Speech Recognition (works without API key)
  const { segments, interimResult, error, isSupported } = useBrowserSpeechRecognition(isRecording);

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndMeeting = () => {
    setIsRecording(false);

    // Compile Transcript to HTML
    const transcriptHTML = segments
      .map((s) => `<p><strong>${s.speaker} (${s.time}):</strong> ${s.text}</p>`)
      .join("");

    const newId = Math.random().toString(36).substr(2, 9);

    addNote({
      id: newId,
      title: "Meeting Transcript",
      preview: segments.length > 0 ? segments[0].text.slice(0, 100) + "..." : "No audio recorded.",
      content: `<h2>Meeting Transcript</h2>${transcriptHTML}`,
      date: new Date().toISOString(),
      tags: ["Meeting", "Transcript"],
      type: "meeting",
    });

    router.push(`/notes/${newId}`);
  };

  const handleStartRecording = () => {
    if (!isSupported) {
      toast.error(
        "Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }
    setHasStarted(true);
    setIsRecording(true);
    toast.success("Recording started! Speak clearly into your microphone.");
  };

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
            <Button variant="destructive" size="sm" onClick={handleEndMeeting}>
              <Square className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">End Meeting</span>
              <span className="sm:hidden">End</span>
            </Button>
          </div>
        </div>

        <div className="bg-background flex-1 overflow-auto">
          <Editor initialContent="<h2>Meeting Notes</h2><p>Start typing...</p>" />
        </div>
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden h-full w-87.5 border-l lg:block">
        <TranscriptionSidebar segments={segments} interimResult={interimResult} />
      </div>
    </div>
  );
}
