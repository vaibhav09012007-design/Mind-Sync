import { StateCreator } from "zustand";
import {
  createNote,
  updateNote as serverUpdateNote,
  deleteNote as serverDeleteNote,
} from "@/actions/notes";
import { showToast } from "@/lib/toast-queue";
import { logger } from "@/lib/logger";
import type { Note, AppState } from "../types";

export interface NoteSlice {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export const createNoteSlice: StateCreator<AppState, [], [], NoteSlice> = (set, get) => ({
  notes: [],

  setNotes: (notes) => set({ notes }),

  addNote: async (note) => {
    set((state) => ({ notes: [note, ...state.notes] }));

    try {
      const result = await createNote(note);
      if (!result.success) {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== note.id),
        }));
        showToast.error(result.error || "Failed to create note");
      }
    } catch (error) {
      logger.error("Failed to create note", error as Error, { action: "addNote" });
      showToast.error("Failed to save note");
    }
  },

  updateNote: async (id, updates) => {
    const note = get().notes.find((n) => n.id === id);

    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));

    try {
      const result = await serverUpdateNote(id, {
        title: updates.title,
        content: updates.content,
        preview: updates.preview,
        tags: updates.tags,
        type: updates.type,
        metadata: updates.metadata,
        date: updates.date,
      });
      if (!result.success && note) {
        // Rollback
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? note : n)),
        }));
        showToast.error(result.error || "Failed to update note");
      }
    } catch (error) {
      logger.error("Failed to update note", error as Error, { action: "updateNote" });
      if (note) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? note : n)),
        }));
      }
      showToast.error("Failed to update note");
    }
  },

  deleteNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));

    try {
      const result = await serverDeleteNote(id);
      if (!result.success && note) {
        set((state) => ({ notes: [...state.notes, note] }));
        showToast.error(result.error || "Failed to delete note");
      }
    } catch (error) {
      logger.error("Failed to delete note", error as Error, { action: "deleteNote" });
      showToast.error("Failed to delete note");
    }
  },
});
