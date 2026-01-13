import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { startOfDay } from "date-fns";
import { 
  createTask, toggleTaskStatus, deleteTask, 
  createEvent, deleteEvent, 
  createNote, deleteNote 
} from "@/app/actions";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // ISO Date String
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO Date String
  end: string;   // ISO Date String
  type: "work" | "personal" | "meeting";
  googleId?: string; // ID from Google Calendar
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  content: string; // HTML content
  date: string; // ISO
  tags: string[];
  type: "meeting" | "personal";
  eventId?: string; // Link to CalendarEvent
}

interface AppState {
  // State
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  selectedDate: string; // ISO Date String
  googleAccessToken?: string;

  // Actions
  setGoogleAccessToken: (token: string) => void;
  setSelectedDate: (date: Date) => void;
  
  // Bulk set (for hydration from server)
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setNotes: (notes: Note[]) => void;

  addTask: (title: string, dueDate?: Date) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      events: [],
      notes: [],
      selectedDate: new Date().toISOString(),
      googleAccessToken: undefined,

      setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
      setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),
      
      setTasks: (tasks) => set({ tasks }),
      setEvents: (events) => set({ events }),
      setNotes: (notes) => set({ notes }),

      addTask: async (title, dueDate = new Date()) => {
          const newTask: Task = {
            id: uuidv4(),
            title,
            completed: false,
            dueDate: dueDate.toISOString()
          };
          // Optimistic update
          set((state) => ({ tasks: [...state.tasks, newTask] }));
          
          try {
            await createTask(newTask);
          } catch (error) {
            console.error("Failed to save task", error);
            // Rollback could go here
          }
      },

      toggleTask: async (id) => {
          const task = get().tasks.find(t => t.id === id);
          if (!task) return;

          set((state) => {
              const updatedTasks = state.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
              return { tasks: updatedTasks };
          });
          
          try {
             await toggleTaskStatus(id, !task.completed);
          } catch (error) {
             console.error("Failed to toggle task", error);
          }
      },

      deleteTask: async (id) => {
          set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
          try {
            await deleteTask(id);
          } catch (error) {
            console.error("Failed to delete task", error);
          }
      },

      addEvent: async (event) => {
          const newEvent: CalendarEvent = { ...event, id: uuidv4() };
          set((state) => ({ events: [...state.events, newEvent] }));
          
          try {
             await createEvent(newEvent);
          } catch (error) {
             console.error("Failed to create event", error);
          }
      },

      updateEvent: (id, updates) => {
          set((state) => {
              const updatedEvents = state.events.map((e) => e.id === id ? { ...e, ...updates } : e);
              return { events: updatedEvents };
          });
          // TODO: Implement Update Action
      },

      deleteEvent: async (id) => {
          set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
          try {
            await deleteEvent(id);
          } catch (error) {
            console.error("Failed to delete event", error);
          }
      },

      addNote: async (note) => {
          set((state) => ({ notes: [note, ...state.notes] }));
          try {
            await createNote(note);
          } catch (error) {
            console.error("Failed to create note", error);
          }
      },

      updateNote: (id, updates) => {
          set((state) => {
              const updatedNotes = state.notes.map((n) => n.id === id ? { ...n, ...updates } : n);
              return { notes: updatedNotes };
          });
          // TODO: Implement Update Action
      },

      deleteNote: async (id) => {
          set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
          try {
            await deleteNote(id);
          } catch (error) {
            console.error("Failed to delete note", error);
          }
      },
    }),
    {
      name: "mindsync-storage", // key in localStorage
      storage: createJSONStorage(() => localStorage), // bind to localStorage
    }
  )
);
