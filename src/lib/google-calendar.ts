export const GoogleCalendarService = {
  async listEvents(accessToken: string) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=10&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Google Calendar API Error:", response.status, errorBody);
        throw new Error(`Failed to fetch calendar events: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  },

  async insertEvent(accessToken: string, event: { title: string; start: string; end: string }) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
        }),
      }
    );

    if (!response.ok) {
        throw new Error("Failed to create event in Google Calendar");
    }
    return await response.json();
  },

  async deleteEvent(accessToken: string, eventId: string) {
      // Note: This requires mapping local ID to Google ID, which we don't have perfectly synced yet.
      // We would need to store the 'googleId' on the event object in our store.
      // For this prototype, we'll implement the method signature.
      
      /* 
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` }
        }
      ); 
      */
  }
};
