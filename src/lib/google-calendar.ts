/**
 * Enhanced Google Calendar Service
 * Supports multi-calendar, recurring events, and real-time sync
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: { email: string; responseStatus: string }[];
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: { uri: string; entryPointType: string }[];
  };
  recurrence?: string[];
  recurringEventId?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  accessRole: string;
}

export const GoogleCalendarService = {
  /**
   * List all calendars the user has access to
   */
  async listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google Calendar List Error:", response.status, errorBody);
      throw new Error(`Failed to fetch calendars: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  },

  /**
   * List events from a calendar with pagination support
   */
  async listEvents(
    accessToken: string,
    options: {
      calendarId?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      pageToken?: string;
      showDeleted?: boolean;
      singleEvents?: boolean;
    } = {}
  ): Promise<{ items: GoogleCalendarEvent[]; nextPageToken?: string }> {
    const {
      calendarId = "primary",
      timeMin = new Date().toISOString(),
      timeMax,
      maxResults = 50,
      pageToken,
      showDeleted = false,
      singleEvents = true,
    } = options;

    const params = new URLSearchParams({
      timeMin,
      maxResults: String(maxResults),
      singleEvents: String(singleEvents),
      orderBy: "startTime",
      showDeleted: String(showDeleted),
    });

    if (timeMax) params.append("timeMax", timeMax);
    if (pageToken) params.append("pageToken", pageToken);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google Calendar API Error:", response.status, errorBody);
      throw new Error(`Failed to fetch calendar events: ${response.status}`);
    }

    const data = await response.json();
    return {
      items: data.items || [],
      nextPageToken: data.nextPageToken,
    };
  },

  /**
   * Create a new event with support for recurrence and conferencing
   */
  async insertEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      start: string;
      end: string;
      location?: string;
      attendees?: string[];
      recurrence?: string[]; // e.g., ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"]
      createMeetLink?: boolean;
    },
    calendarId: string = "primary"
  ): Promise<GoogleCalendarEvent> {
    const body: Record<string, unknown> = {
      summary: event.title,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
    };

    if (event.description) body.description = event.description;
    if (event.location) body.location = event.location;
    if (event.attendees) {
      body.attendees = event.attendees.map((email) => ({ email }));
    }
    if (event.recurrence) body.recurrence = event.recurrence;
    if (event.createMeetLink) {
      body.conferenceData = {
        createRequest: {
          requestId: `mindsync-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const conferenceParam = event.createMeetLink
      ? "?conferenceDataVersion=1"
      : "";

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${conferenceParam}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google Create Event Error:", errorBody);
      throw new Error("Failed to create event in Google Calendar");
    }
    return await response.json();
  },

  /**
   * Update an existing event
   */
  async updateEvent(
    accessToken: string,
    eventId: string,
    event: {
      title?: string;
      description?: string;
      start?: string;
      end?: string;
      location?: string;
    },
    calendarId: string = "primary"
  ): Promise<GoogleCalendarEvent> {
    const body: Record<string, unknown> = {};
    if (event.title) body.summary = event.title;
    if (event.description !== undefined) body.description = event.description;
    if (event.start) body.start = { dateTime: event.start };
    if (event.end) body.end = { dateTime: event.end };
    if (event.location !== undefined) body.location = event.location;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Google Update Error:", text);
      throw new Error("Failed to update event in Google Calendar");
    }
    return await response.json();
  },

  /**
   * Delete an event
   */
  async deleteEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = "primary"
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete event from Google Calendar");
    }
  },

  /**
   * Get a single event by ID
   */
  async getEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = "primary"
  ): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get event from Google Calendar");
    }
    return await response.json();
  },

  /**
   * Quick add event using natural language
   */
  async quickAdd(
    accessToken: string,
    text: string,
    calendarId: string = "primary"
  ): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?text=${encodeURIComponent(text)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to quick add event");
    }
    return await response.json();
  },

  /**
   * Set up a watch channel for real-time sync (webhook)
   */
  async watchCalendar(
    accessToken: string,
    webhookUrl: string,
    calendarId: string = "primary"
  ): Promise<{ resourceId: string; expiration: string }> {
    const channelId = `mindsync-${Date.now()}`;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Watch setup error:", error);
      throw new Error("Failed to set up calendar watch");
    }

    const data = await response.json();
    return {
      resourceId: data.resourceId,
      expiration: data.expiration,
    };
  },

  /**
   * Stop a watch channel
   */
  async stopWatch(
    accessToken: string,
    channelId: string,
    resourceId: string
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/channels/stop`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          resourceId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to stop calendar watch");
    }
  },

  /**
   * Get free/busy information for scheduling
   */
  async getFreeBusy(
    accessToken: string,
    timeMin: string,
    timeMax: string,
    calendarIds: string[] = ["primary"]
  ): Promise<Record<string, { busy: { start: string; end: string }[] }>> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: calendarIds.map((id) => ({ id })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get free/busy information");
    }

    const data = await response.json();
    return data.calendars;
  },

  /**
   * Extract meeting link from an event
   */
  getMeetingLink(event: GoogleCalendarEvent): string | null {
    // Check hangout link first
    if (event.hangoutLink) return event.hangoutLink;

    // Check conference data
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (e) => e.entryPointType === "video"
      );
      if (videoEntry) return videoEntry.uri;
    }

    // Check description for Zoom/Teams links
    if (event.description) {
      const zoomMatch = event.description.match(
        /https:\/\/[a-z0-9]+\.zoom\.us\/j\/\d+/i
      );
      if (zoomMatch) return zoomMatch[0];

      const teamsMatch = event.description.match(
        /https:\/\/teams\.microsoft\.com\/l\/meetup-join[^\s<]*/i
      );
      if (teamsMatch) return teamsMatch[0];
    }

    return null;
  },
};

