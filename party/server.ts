import type { PartyKitServer, Connection, Room } from "partykit/server";
import { onConnect } from "y-partykit";

/**
 * PartyKit server handling:
 * 1. Yjs collaborative editing for note-* rooms
 * 2. Workspace presence for workspace-* rooms
 * 3. Comment broadcast for comment notifications
 */

type PresenceUser = {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  activePage: string;
  lastSeen: number;
};

type PresenceMessage =
  | { type: "presence:join"; user: PresenceUser }
  | { type: "presence:update"; user: PresenceUser }
  | { type: "presence:leave"; userId: string }
  | { type: "presence:sync"; users: PresenceUser[] }
  | { type: "comment:new"; comment: unknown };

// Track presence per room
const roomPresence = new Map<string, Map<string, PresenceUser>>();

function getOrCreatePresence(roomId: string): Map<string, PresenceUser> {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  return roomPresence.get(roomId)!;
}

function broadcastPresenceSync(room: Room) {
  const presence = getOrCreatePresence(room.id);
  const users = Array.from(presence.values());
  const syncMessage = JSON.stringify({ type: "presence:sync", users });

  for (const conn of room.getConnections()) {
    conn.send(syncMessage);
  }
}

export default {
  onConnect(conn: Connection, room: Room) {
    // Yjs collaborative editing for notes
    if (room.id.startsWith("note-")) {
      return onConnect(conn as any, room as any, {
        persist: true,
      });
    }

    // Workspace presence rooms — send current state to new connection
    if (room.id.startsWith("workspace-")) {
      const presence = getOrCreatePresence(room.id);
      const users = Array.from(presence.values());
      conn.send(JSON.stringify({ type: "presence:sync", users }));
      return;
    }

    // Generic room — broadcast connect
    room.broadcast(
      JSON.stringify({ type: "connect", connectionId: conn.id }),
      [conn.id]
    );
  },

  onMessage(message: string | ArrayBuffer | ArrayBufferView, conn: Connection, room: Room) {
    if (room.id.startsWith("note-")) return; // handled by y-partykit

    // Only handle string messages (binary = y-partykit)
    if (typeof message !== "string") return;

    try {
      const parsed = JSON.parse(message) as PresenceMessage;

      if (room.id.startsWith("workspace-")) {
        const presence = getOrCreatePresence(room.id);

        switch (parsed.type) {
          case "presence:join":
          case "presence:update":
            presence.set(parsed.user.userId, {
              ...parsed.user,
              lastSeen: Date.now(),
            });
            // Broadcast updated user to all others
            room.broadcast(message, [conn.id]);
            break;

          case "presence:leave":
            presence.delete(parsed.userId);
            room.broadcast(message, [conn.id]);
            break;

          case "comment:new":
            // Broadcast comment to all connections in the room
            room.broadcast(message, [conn.id]);
            break;
        }
        return;
      }

      // Generic broadcast for other rooms
      room.broadcast(message, [conn.id]);
    } catch {
      // Non-JSON message — broadcast as-is
      room.broadcast(message, [conn.id]);
    }
  },

  onClose(conn: Connection, room: Room) {
    if (room.id.startsWith("note-")) return;

    if (room.id.startsWith("workspace-")) {
      // We don't know the userId from the connection alone,
      // so we clean up stale entries (lastSeen > 30s ago)
      const presence = getOrCreatePresence(room.id);
      const now = Date.now();
      for (const [userId, user] of presence) {
        if (now - user.lastSeen > 30_000) {
          presence.delete(userId);
          room.broadcast(
            JSON.stringify({ type: "presence:leave", userId })
          );
        }
      }
      return;
    }

    room.broadcast(
      JSON.stringify({ type: "disconnect", connectionId: conn.id })
    );
  },
} satisfies PartyKitServer;
