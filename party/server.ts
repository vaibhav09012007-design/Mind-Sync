import type { Party, PartyKitServer, Connection } from "partykit/server";
import { onConnect } from "y-partykit";

export default {
  onConnect(conn, room, ctx) {
    console.log(`Connected: ${conn.id} to room ${room.id}`);

    // If it's a notes document, we wrap it with y-partykit
    if (room.id.startsWith("note-")) {
      return onConnect(conn as any, room as any, {
        persist: true, // We can persist to SQLite internally or sync back to DB later
      });
    }

    // For plain presence (Kanban)
    room.broadcast(JSON.stringify({ type: "connect", connectionId: conn.id }), [conn.id]);
  },

  onMessage(message, conn, room) {
    if (room.id.startsWith("note-")) return; // handled by y-partykit

    // Broadcast messages for presence/cursors
    room.broadcast(message as string, [conn.id]);
  },

  onClose(conn, room) {
    if (room.id.startsWith("note-")) return;

    room.broadcast(JSON.stringify({ type: "disconnect", connectionId: conn.id }));
  },
} satisfies PartyKitServer;
