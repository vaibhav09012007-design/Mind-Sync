"use client";

/**
 * Daily Briefing Card
 * AI-powered daily overview for the dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { generateDailyBriefing, type DailyBriefing } from "@/actions/daily-briefing";
import { motion, AnimatePresence } from "framer-motion";

export function DailyBriefingCard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDailyBriefing();
      if (result.success) {
        setBriefing(result.data);
      } else {
        setError(result.error || "Failed to generate briefing");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if already dismissed today
    const dismissedDate = localStorage.getItem("briefing-dismissed");
    if (dismissedDate === new Date().toDateString()) {
      setDismissed(true);
      return;
    }
    fetchBriefing();
  }, [fetchBriefing]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("briefing-dismissed", new Date().toDateString());
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />

          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-base">Daily Briefing</CardTitle>
                {briefing && (
                  <p className="text-muted-foreground text-sm mt-0.5">{briefing.greeting}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={fetchBriefing}
                disabled={loading}
                aria-label="Refresh briefing"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDismiss}
                aria-label="Dismiss briefing"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {loading && !briefing && (
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {briefing && (
              <>
                {/* Stats row */}
                <div className="flex gap-3">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {briefing.stats.totalTasks} tasks
                  </Badge>
                  {briefing.stats.overdueTasks > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {briefing.stats.overdueTasks} overdue
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {briefing.stats.todayEvents} events
                  </Badge>
                </div>

                {/* Priorities */}
                {briefing.priorities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1.5">🎯 Top Priorities</h4>
                    <ul className="space-y-1">
                      {briefing.priorities.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-purple-500 font-medium shrink-0">{i + 1}.</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Schedule */}
                <div>
                  <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Schedule
                  </h4>
                  <p className="text-sm text-muted-foreground">{briefing.scheduleOverview}</p>
                </div>

                {/* Suggestions */}
                {briefing.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Tips
                    </h4>
                    <ul className="space-y-1">
                      {briefing.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          💡 {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Motivational note */}
                <p className="text-xs text-muted-foreground/70 italic border-t border-border/50 pt-2">
                  {briefing.motivationalNote}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
