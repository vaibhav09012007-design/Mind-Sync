"use client";

import { useState, useEffect } from "react";
import * as chrono from "chrono-node";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addHours, startOfHour } from "date-fns";
import { Calendar, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_STYLES } from "./calendar-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAddPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: { title: string; start: Date; end: Date; type: string }) => void;
  initialDate?: Date;
  initialTime?: string; // "HH:mm"
}

export function QuickAddPopover({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTime,
}: QuickAddPopoverProps) {
  const [input, setInput] = useState("");
  const [parsedDate, setParsedDate] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedType, setSelectedType] = useState("work");

  // Initialize state when opening
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput("");
      // Default to provided date/time or next hour
      const start = initialDate ? new Date(initialDate) : startOfHour(addHours(new Date(), 1));

      if (initialTime && initialDate) {
        const [h, m] = initialTime.split(":").map(Number);
        start.setHours(h, m);
      }

      const end = addHours(start, 1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParsedDate({ start, end });
    }
  }, [isOpen, initialDate, initialTime]);

  // Parse input as user types
  useEffect(() => {
    if (!input.trim()) return;

    const parsed = chrono.parse(input, initialDate || new Date(), { forwardDate: true });

    if (parsed.length > 0) {
      const result = parsed[0];
      const start = result.start.date();
      const end = result.end ? result.end.date() : addHours(start, 1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParsedDate({ start, end });
    }
  }, [input, initialDate]);

  const handleSave = () => {
    if (!parsedDate) return;

    // Extract title by removing time-related text (simple heuristic)
    // For now, use raw input or clean it up if chrono provides text to remove
    // Chrono's `text` property is the matched date string.
    // We can remove matched text from input to get the title.

    let title = input;
    const parsed = chrono.parse(input, initialDate || new Date());
    if (parsed.length > 0) {
      // Remove the date part from the title
      title = input.replace(parsed[0].text, "").trim();
      // Remove extra prepositions if left hanging (e.g. "Meeting at")
      title = title.replace(/\s+(at|on|in)$/i, "").trim();
    }

    if (!title) title = "New Event";

    onSave({
      title,
      start: parsedDate.start,
      end: parsedDate.end,
      type: selectedType,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quick Add Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quick-input">Describe your event</Label>
            <Input
              id="quick-input"
              placeholder="e.g. Lunch with John tomorrow at 1pm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <p className="text-muted-foreground text-xs">
              Try natural language: &quot;Team meeting every Friday at 10am&quot;
            </p>
          </div>

          {/* Preview Parsed Data */}
          <div className="bg-muted/50 space-y-2 rounded-md p-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>
                {parsedDate ? format(parsedDate.start, "EEEE, MMMM d, yyyy") : "Select date"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>
                {parsedDate ? (
                  <>
                    {format(parsedDate.start, "h:mm a")} - {format(parsedDate.end, "h:mm a")}
                  </>
                ) : (
                  "Select time"
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="text-muted-foreground h-4 w-4" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Deep Work</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
