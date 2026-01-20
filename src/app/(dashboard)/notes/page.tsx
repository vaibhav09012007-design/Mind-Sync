"use client";

import { StickyNote, PenLine } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotesIndexPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center animate-fade-in-up">
      <GlassCard className="flex flex-col items-center justify-center p-12 max-w-lg w-full border-dashed border-2">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse-glow" />
          <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 p-6 rounded-full border border-white/20 shadow-inner">
            <StickyNote className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 bg-yellow-400/80 rounded-full p-1.5 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
            <PenLine className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h2 className="mb-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
          Select a note to view
        </h2>
        
        <p className="max-w-xs text-muted-foreground leading-relaxed mb-8">
          Choose a note from the sidebar or create a new one to capture your next big idea.
        </p>

        {/* 
          Note: The actual creation is handled in the sidebar or separate button, 
          but we could add a CTA here if we had the context hook 
        */}
        <div className="flex gap-4">
           <div className="h-1 w-12 rounded-full bg-border" />
           <div className="h-1 w-12 rounded-full bg-border" />
           <div className="h-1 w-12 rounded-full bg-border" />
        </div>
      </GlassCard>
    </div>
  );
}
