import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { SpeechSegment } from "@/hooks/useSpeechRecognition";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

interface Props {
  segments: SpeechSegment[];
  interimResult?: string;
}

const ActionItemText = ({ text }: { text: string }) => {
  const { addTask } = useStore();

  // Regex to find "TODO: ...", "Action Item: ...", "I will ..." until punctuation/end
  const regex = /(TODO:|Action Item:|I will)\s+([^.?!]+)/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  // We need to use a loop because React requires an array of nodes
  // Clone the regex for loop execution
  const loopRegex = new RegExp(regex);

  while ((match = loopRegex.exec(text)) !== null) {
    // push text before match
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const fullMatch = match[0];
    const content = match[2];
    const taskTitle = content.trim();
    const matchIndex = match.index;

    parts.push(
      <Popover key={`popover-${matchIndex}`}>
        <PopoverTrigger asChild>
          <span className="cursor-pointer rounded bg-yellow-500/20 px-1 font-medium text-yellow-600 underline decoration-dashed underline-offset-4 transition-colors hover:bg-yellow-500/30 dark:text-yellow-400">
            {fullMatch}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="text-primary h-4 w-4" />
              Detected Action Item
            </h4>
            <p className="text-muted-foreground bg-muted rounded p-2 text-xs break-words">
              &quot;{taskTitle}&quot;
            </p>
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                addTask(taskTitle);
                toast.success("Task created from transcript!");
              }}
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );

    lastIndex = loopRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-end-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  if (parts.length === 0) return <>{text}</>;

  return <>{parts}</>;
};

export function TranscriptionSidebar({ segments = [], interimResult }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [segments, interimResult]);

  return (
    <div className="bg-muted/10 flex h-full w-[350px] flex-col border-l">
      <div className="bg-background/50 border-b p-4 backdrop-blur-sm">
        <h3 className="text-sm font-semibold">Live Transcript</h3>
        <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening...
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {segments.map((segment) => (
            <div key={segment.id} className="animate-in fade-in slide-in-from-bottom-2 flex gap-3">
              <Avatar className="mt-1 h-8 w-8">
                <AvatarFallback>{segment.speaker[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{segment.speaker}</span>
                  <span className="text-muted-foreground text-[10px]">{segment.time}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <ActionItemText text={segment.text} />
                </p>
              </div>
            </div>
          ))}

          {/* Live Interim Result */}
          {interimResult && (
            <div className="flex gap-3 opacity-70">
              <Avatar className="mt-1 h-8 w-8">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">You</span>
                  <span className="text-muted-foreground text-[10px]">Now</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">
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
