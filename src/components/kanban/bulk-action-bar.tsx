"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, CheckCircle2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedIds, onClearSelection }: BulkActionBarProps) {
  const { bulkDeleteTasks, bulkUpdateTasks } = useStore();

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-white shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
          <span className="font-semibold">{selectedIds.length}</span>
          <span className="text-sm text-slate-300">selected</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 hover:bg-slate-800 hover:text-white"
            onClick={() => {
              bulkUpdateTasks(selectedIds, { completed: true });
              onClearSelection();
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
            Complete
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-red-400 hover:bg-red-900/50 hover:text-red-400"
            onClick={() => {
              if (confirm(`Delete ${selectedIds.length} tasks?`)) {
                bulkDeleteTasks(selectedIds);
                onClearSelection();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="ml-2 h-6 w-6 rounded-full hover:bg-slate-800"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
