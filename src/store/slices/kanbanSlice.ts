import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Column, ViewSettings, AppState } from "../types";
import { DEFAULT_COLUMNS, DEFAULT_VIEW_SETTINGS } from "../types";

export interface KanbanSlice {
  columns: Column[];
  viewSettings: ViewSettings;
  setColumns: (columns: Column[]) => void;
  setViewSettings: (settings: Partial<ViewSettings>) => void;
  addColumn: (column: Omit<Column, "id" | "order">) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (columns: Column[]) => void;
}

export const createKanbanSlice: StateCreator<AppState, [], [], KanbanSlice> = (set, get) => ({
  columns: DEFAULT_COLUMNS,
  viewSettings: DEFAULT_VIEW_SETTINGS,

  setColumns: (columns) => set({ columns }),

  setViewSettings: (settings) =>
    set((state) => ({ viewSettings: { ...state.viewSettings, ...settings } })),

  addColumn: (column) => {
    const newColumn: Column = {
      ...column,
      id: uuidv4(),
      order: get().columns.length,
    };
    set((state) => ({ columns: [...state.columns, newColumn] }));
  },

  updateColumn: (id, updates) => {
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteColumn: (id) => {
    set((state) => ({ columns: state.columns.filter((c) => c.id !== id) }));
  },

  reorderColumns: (columns) => {
    // Assume columns are passed in new order
    const updated = columns.map((c, i) => ({ ...c, order: i }));
    set({ columns: updated });
  },
});
