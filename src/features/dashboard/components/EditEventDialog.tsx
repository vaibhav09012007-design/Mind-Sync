"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { parseISO, format, setMinutes, setHours } from "date-fns";

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  currentDate: Date;
}

export function EditEventDialog({ isOpen, onOpenChange, eventId, currentDate }: EditEventDialogProps) {
  const { events, updateEvent, deleteEvent } = useStore();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (isOpen && eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTitle(event.title);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStartTime(format(parseISO(event.start), "HH:mm"));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEndTime(format(parseISO(event.end), "HH:mm"));
      }
    }
  }, [isOpen, eventId, events]);

  const handleSave = () => {
    if (!eventId) return;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const start = setMinutes(setHours(currentDate, startH), startM);
    const end = setMinutes(setHours(currentDate, endH), endM);

    updateEvent(eventId, {
      title,
      start: start.toISOString(),
      end: end.toISOString()
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (eventId) {
      deleteEvent(eventId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Make changes to your scheduled event.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="edit-title">Event Title</Label>
                    <Input 
                        id="edit-title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-start">Start Time</Label>
                        <Input 
                            id="edit-start" 
                            type="time" 
                            value={startTime} 
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-end">End Time</Label>
                        <Input 
                            id="edit-end" 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="destructive" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
