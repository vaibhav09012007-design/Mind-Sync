"use client";

import { Button } from "@/components/ui/button";
import { Pause, Square, Play, Link as LinkIcon, MonitorUp, FileText } from "lucide-react";
import { Editor } from "@/features/notes/components/Editor";
import { AudioVisualizer } from "@/features/meeting-mode/components/AudioVisualizer";
import { TranscriptionSidebar } from "@/features/meeting-mode/components/TranscriptionSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function MeetingPage() {
  const router = useRouter();
  const { events, addNote } = useStore();
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [linkedEventId, setLinkedEventId] = useState<string>("");
  
  // Real Speech Recognition with System Audio
  const { segments, interimResult, startSystemAudio } = useSpeechRecognition(isRecording);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndMeeting = () => {
      setIsRecording(false);
      
      // Compile Transcript to HTML
      const transcriptHTML = segments.map(s => 
        `<p><strong>${s.speaker} (${s.time}):</strong> ${s.text}</p>`
      ).join('');

      const newId = Math.random().toString(36).substr(2, 9);
      
      addNote({
          id: newId,
          title: "Meeting Transcript",
          preview: segments.length > 0 ? segments[0].text.slice(0, 100) + "..." : "No audio recorded.",
          content: `<h2>Meeting Transcript</h2>${transcriptHTML}`,
          date: new Date().toISOString(),
          tags: ["Meeting", "Transcript"],
          type: "meeting"
      });

      router.push(`/notes/${newId}`);
  };

  const handleShareScreen = async () => {
      try {
          await startSystemAudio();
          toast.success("System audio sharing enabled. Recording meeting audio.");
      } catch (err) {
          console.error("Screen share cancelled", err);
          toast.error("Failed to share system audio.");
      }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden relative">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Control Bar */}
            <div className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-background shrink-0">
                <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
                     <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">Active Meeting</span>
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(duration)}</span>
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
                        <SheetContent className="p-0 w-[85vw] sm:w-100">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Meeting Transcript</SheetTitle>
                                <SheetDescription>Real-time transcription of the ongoing meeting</SheetDescription>
                            </SheetHeader>
                            <TranscriptionSidebar segments={segments} interimResult={interimResult} />
                        </SheetContent>
                     </Sheet>

                     {/* Link to Calendar Event */}
                     <div className="hidden md:block">
                        <Select value={linkedEventId} onValueChange={setLinkedEventId}>
                            <SelectTrigger className="w-45 h-8 text-xs">
                                <LinkIcon className="mr-2 h-3 w-3" />
                                <SelectValue placeholder="Link to Event" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map(event => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.title}
                                    </SelectItem>
                                ))}
                                {events.length === 0 && <div className="p-2 text-xs text-muted-foreground">No events found</div>}
                            </SelectContent>
                        </Select>
                     </div>

                     <Button variant="ghost" size="icon" onClick={handleShareScreen} title="Share System Audio" className="hidden sm:flex">
                        <MonitorUp className="h-4 w-4" />
                     </Button>

                    <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setIsRecording(!isRecording)}
                    >
                        {isRecording ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleEndMeeting}
                    >
                        <Square className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">End Meeting</span>
                        <span className="sm:hidden">End</span>
                    </Button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-background">
                <Editor initialContent="<h2>Meeting Notes</h2><p>Start typing...</p>" />
            </div>
        </div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:block w-87.5 border-l h-full">
            <TranscriptionSidebar segments={segments} interimResult={interimResult} />
        </div>
    </div>
  );
}