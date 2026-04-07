"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useEvents, useEventActions } from "@/store/selectors";
import { parseISO, format, setMinutes, setHours } from "date-fns";

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  currentDate: Date;
}

export function EditEventDialog({ isOpen, onOpenChange, eventId, currentDate }: EditEventDialogProps) {
  const events = useEvents();
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {event ? (
        <EditEventDialogInner key={eventId} event={event} currentDate={currentDate} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function EditEventDialogInner({ event, currentDate, onOpenChange }: {
  event: { id: string; title: string; start: string; end: string };
  currentDate: Date;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateEvent, deleteEvent } = useEventActions();
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(format(parseISO(event.start), "HH:mm"));
  const [endTime, setEndTime] = useState(format(parseISO(event.end), "HH:mm"));

  const handleSave = () => {
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const start = setMinutes(setHours(currentDate, startH), startM);
    const end = setMinutes(setHours(currentDate, endH), endM);

    updateEvent(event.id, {
      title,
      start: start.toISOString(),
      end: end.toISOString()
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteEvent(event.id);
    onOpenChange(false);
  };

  return (
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
  );
}
