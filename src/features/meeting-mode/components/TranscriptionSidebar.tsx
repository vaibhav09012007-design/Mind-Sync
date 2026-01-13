import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef } from "react";
import { SpeechSegment } from "@/hooks/useSpeechRecognition";

interface Props {
    segments: SpeechSegment[];
    interimResult?: string;
}

export function TranscriptionSidebar({ segments = [], interimResult }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [segments, interimResult]);

  return (
    <div className="flex flex-col h-full border-l bg-muted/10 w-[350px]">
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
        <h3 className="font-semibold text-sm">Live Transcript</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening...
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
            {segments.map((segment) => (
                <div key={segment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>{segment.speaker[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{segment.speaker}</span>
                            <span className="text-[10px] text-muted-foreground">{segment.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {segment.text}
                        </p>
                    </div>
                </div>
            ))}
            
            {/* Live Interim Result */}
            {interimResult && (
                 <div className="flex gap-3 opacity-70">
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">You</span>
                            <span className="text-[10px] text-muted-foreground">Now</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            {interimResult}...
                        </p>
                    </div>
                </div>
            )}

            <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
