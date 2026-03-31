import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  createEvent,
  updateEvent as serverUpdateEvent,
  deleteEvent,
} from "@/actions/events";
import { showToast } from "@/lib/toast-queue";
import { logger } from "@/lib/logger";
import type { CalendarEvent, AppState } from "../types";

export interface EventSlice {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

export const createEventSlice: StateCreator<AppState, [], [], EventSlice> = (set, get) => ({
  events: [],

  setEvents: (events) => set({ events }),

  addEvent: async (event) => {
    const newEvent: CalendarEvent = { ...event, id: uuidv4() };
    set((state) => ({ events: [...state.events, newEvent] }));

    try {
      const result = await createEvent(newEvent);
      if (!result.success) {
        set((state) => ({
          events: state.events.filter((e) => e.id !== newEvent.id),
        }));
        showToast.error(result.error || "Failed to create event");
      }
    } catch (error) {
      logger.error("Failed to create event", error as Error, { action: "addEvent" });
      showToast.error("Failed to save event");
    }
  },

  updateEvent: async (id, updates) => {
    const event = get().events.find((e) => e.id === id);

    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));

    try {
      const result = await serverUpdateEvent(id, {
        title: updates.title,
        start: updates.start,
        end: updates.end,
      });
      if (!result.success && event) {
        // Rollback
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? event : e)),
        }));
        showToast.error(result.error || "Failed to update event");
      }
    } catch (error) {
      logger.error("Failed to update event", error as Error, { action: "updateEvent" });
      if (event) {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? event : e)),
        }));
      }
      showToast.error("Failed to update event");
    }
  },

  deleteEvent: async (id) => {
    const event = get().events.find((e) => e.id === id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));

    try {
      const result = await deleteEvent(id);
      if (!result.success && event) {
        set((state) => ({ events: [...state.events, event] }));
        showToast.error(result.error || "Failed to delete event");
      }
    } catch (error) {
      logger.error("Failed to delete event", error as Error, { action: "deleteEvent" });
      showToast.error("Failed to delete event");
    }
  },
});
