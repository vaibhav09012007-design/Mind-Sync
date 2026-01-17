"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { GoogleCalendarService, GoogleCalendarEvent } from "@/lib/google-calendar";
import { useStore, CalendarEvent } from "@/store/useStore";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncState {
  status: SyncStatus;
  lastSynced: Date | null;
  pendingChanges: number;
  error: string | null;
}

// Convert Google Calendar event to local format
function googleEventToLocal(
  event: GoogleCalendarEvent
): Omit<CalendarEvent, "id"> & { googleId: string } {
  return {
    title: event.summary,
    start: event.start.dateTime,
    end: event.end.dateTime,
    type: "meeting" as const,
    googleId: event.id,
    recurrence: event.recurrence
      ? {
          frequency: "weekly" as const,
          interval: 1,
        }
      : null,
  };
}

// Convert local event to Google Calendar format
function localEventToGoogle(event: CalendarEvent) {
  return {
    title: event.title,
    start: event.start,
    end: event.end,
  };
}

export function useCalendarSync() {
  const { user, isLoaded } = useUser();
  const { events, addEvent, updateEvent } = useStore();

  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSynced: null,
    pendingChanges: 0,
    error: null,
  });

  // Get Google OAuth token from user's external accounts
  const getGoogleToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    // Find Google account in external accounts
    const googleAccount = user.externalAccounts?.find((account) => account.provider === "google");

    if (!googleAccount) {
      console.warn("No Google account connected");
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        error: "No Google account connected. Please sign in with Google.",
      }));
      return null;
    }

    // Try to get the token - this is the token stored when user authenticated
    try {
      // The oauth_access_token might be available on the external account
      // Note: This requires proper OAuth scopes during sign-in
      const token = (googleAccount as any).accessToken || (googleAccount as any).oauth_access_token;

      if (!token) {
        setSyncState((prev) => ({
          ...prev,
          status: "error",
          error:
            "Google Calendar access not granted. Please re-authenticate with Google and grant calendar permissions.",
        }));
        return null;
      }

      return token;
    } catch (error) {
      console.error("Failed to get Google token:", error);
      return null;
    }
  }, [user]);

  // Fetch events from Google Calendar and merge with local
  const pullFromGoogle = useCallback(async () => {
    if (!isLoaded || !user) {
      setSyncState((prev) => ({ ...prev, status: "error", error: "Not signed in" }));
      return;
    }

    try {
      setSyncState((prev) => ({ ...prev, status: "syncing" }));

      const token = await getGoogleToken();
      if (!token) {
        return; // Error already set in getGoogleToken
      }

      // Get events for next 30 days
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { items } = await GoogleCalendarService.listEvents(token, {
        timeMin,
        timeMax,
        maxResults: 100,
      });

      // Merge with local events
      items.forEach((googleEvent) => {
        const existingLocal = events.find((e) => e.googleId === googleEvent.id);
        const localData = googleEventToLocal(googleEvent);

        if (existingLocal) {
          // Update existing local event
          updateEvent(existingLocal.id, {
            title: localData.title,
            start: localData.start,
            end: localData.end,
          });
        } else {
          // Add new event from Google
          addEvent({
            title: localData.title,
            start: localData.start,
            end: localData.end,
            type: localData.type,
            googleId: localData.googleId,
            recurrence: localData.recurrence,
          });
        }
      });

      setSyncState({
        status: "success",
        lastSynced: new Date(),
        pendingChanges: 0,
        error: null,
      });

      toast.success(`Synced ${items.length} events from Google Calendar`);
    } catch (error) {
      console.error("Google Calendar sync error:", error);
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      }));
      toast.error("Failed to sync with Google Calendar");
    }
  }, [isLoaded, user, getGoogleToken, events, addEvent, updateEvent]);

  // Push local changes to Google Calendar
  const pushToGoogle = useCallback(
    async (event: CalendarEvent) => {
      try {
        const token = await getGoogleToken();
        if (!token) {
          toast.error("Not authenticated with Google");
          return;
        }

        if (event.googleId) {
          // Update existing Google event
          await GoogleCalendarService.updateEvent(token, event.googleId, localEventToGoogle(event));
          toast.success("Event updated in Google Calendar");
        } else {
          // Create new event in Google
          const googleEvent = await GoogleCalendarService.insertEvent(token, {
            ...localEventToGoogle(event),
            createMeetLink: false,
          });
          // Update local event with Google ID
          updateEvent(event.id, { googleId: googleEvent.id });
          toast.success("Event added to Google Calendar");
        }
      } catch (error) {
        console.error("Failed to push to Google:", error);
        toast.error("Failed to sync event to Google Calendar");
      }
    },
    [getGoogleToken, updateEvent]
  );

  // Delete from Google Calendar
  const deleteFromGoogle = useCallback(
    async (googleId: string) => {
      try {
        const token = await getGoogleToken();
        if (!token) return;

        await GoogleCalendarService.deleteEvent(token, googleId);
        toast.success("Event deleted from Google Calendar");
      } catch (error) {
        console.error("Failed to delete from Google:", error);
      }
    },
    [getGoogleToken]
  );

  // Full sync (pull then identify conflicts)
  const fullSync = useCallback(async () => {
    await pullFromGoogle();
  }, [pullFromGoogle]);

  return {
    syncState,
    pullFromGoogle,
    pushToGoogle,
    deleteFromGoogle,
    fullSync,
    hasGoogleAccount:
      user?.externalAccounts?.some((account) => account.provider === "google") ?? false,
  };
}
