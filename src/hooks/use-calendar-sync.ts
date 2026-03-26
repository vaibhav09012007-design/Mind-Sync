"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { syncGoogleCalendar } from "@/actions/events";
import { getEvents } from "@/actions/events";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncState {
  status: SyncStatus;
  lastSynced: Date | null;
  pendingChanges: number;
  error: string | null;
}

export function useCalendarSync() {
  const { user, isLoaded } = useUser();

  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSynced: null,
    pendingChanges: 0,
    error: null,
  });

  // Pull from Google Calendar via server action (no client-side token access)
  const pullFromGoogle = useCallback(async () => {
    if (!isLoaded || !user) {
      setSyncState((prev) => ({ ...prev, status: "error", error: "Not signed in" }));
      return;
    }

    try {
      setSyncState((prev) => ({ ...prev, status: "syncing" }));

      // Delegate to server action which handles Google API + DB upsert
      const result = await syncGoogleCalendar();

      if (!result.success) {
        setSyncState((prev) => ({
          ...prev,
          status: "error",
          error: result.error || "Sync failed",
        }));
        toast.error(result.error || "Failed to sync with Google Calendar");
        return;
      }

      // Refresh store events from DB to reflect synced data
      const eventsResult = await getEvents();
      if (eventsResult.success && eventsResult.data) {
        const mappedEvents = eventsResult.data.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.startTime.toISOString(),
          end: e.endTime.toISOString(),
          type: (e.type as "work" | "personal" | "meeting") || "work",
          googleId: e.googleEventId,
          recurrence: null as { frequency: "daily" | "weekly" | "monthly" | "yearly"; interval: number; endDate?: string; daysOfWeek?: number[] } | null,
        }));
        useStore.setState({ events: mappedEvents });
      }

      setSyncState({
        status: "success",
        lastSynced: new Date(),
        pendingChanges: 0,
        error: null,
      });

      toast.success(`Synced ${result.data?.count ?? 0} new events from Google Calendar`);
    } catch (error) {
      console.error("Google Calendar sync error:", error);
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      }));
      toast.error("Failed to sync with Google Calendar");
    }
  }, [isLoaded, user]);

  // Full sync (pull from Google via server action)
  const fullSync = useCallback(async () => {
    await pullFromGoogle();
  }, [pullFromGoogle]);

  return {
    syncState,
    pullFromGoogle,
    fullSync,
    hasGoogleAccount:
      user?.externalAccounts?.some((account) => account.provider === "google") ?? false,
  };
}
