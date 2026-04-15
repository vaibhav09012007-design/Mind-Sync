/**
 * PartyKit client connection manager
 * Provides typed WebSocket connections with reconnection logic
 * for real-time presence and collaboration features
 */

import PartySocket from "partysocket";

// --- Message Protocol Types ---

export type PresenceUser = {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  activePage: string;
  lastSeen: number;
};

export type PartyMessage =
  | { type: "presence:join"; user: PresenceUser }
  | { type: "presence:update"; user: PresenceUser }
  | { type: "presence:leave"; userId: string }
  | { type: "presence:sync"; users: PresenceUser[] }
  | { type: "comment:new"; comment: { id: string; entityType: string; entityId: string; userId: string; content: string } }
  | { type: "connect"; connectionId: string }
  | { type: "disconnect"; connectionId: string };

// --- Color Assignment ---

const PRESENCE_COLORS = [
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#F59E0B", // amber
  "#EF4444", // red
  "#10B981", // emerald
  "#EC4899", // pink
  "#3B82F6", // blue
  "#F97316", // orange
];

let colorIndex = 0;
export function getPresenceColor(): string {
  const color = PRESENCE_COLORS[colorIndex % PRESENCE_COLORS.length];
  colorIndex++;
  return color;
}

// --- Connection Manager ---

type MessageHandler = (message: PartyMessage) => void;

class PartyConnectionManager {
  private connections: Map<string, PartySocket> = new Map();
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  /**
   * Get or create a connection to a PartyKit room
   */
  connect(roomId: string, options?: { host?: string }): PartySocket {
    const existing = this.connections.get(roomId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      return existing;
    }

    const host =
      options?.host ??
      process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
      "localhost:1999";

    const socket = new PartySocket({
      host,
      room: roomId,
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as PartyMessage;
        const roomHandlers = this.handlers.get(roomId);
        if (roomHandlers) {
          roomHandlers.forEach((handler) => handler(message));
        }
      } catch {
        // Non-JSON messages (e.g., y-partykit binary) — ignore silently
      }
    });

    this.connections.set(roomId, socket);
    return socket;
  }

  /**
   * Subscribe to messages from a room
   */
  subscribe(roomId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(roomId)) {
      this.handlers.set(roomId, new Set());
    }
    this.handlers.get(roomId)!.add(handler);

    return () => {
      this.handlers.get(roomId)?.delete(handler);
    };
  }

  /**
   * Send a typed message to a room
   */
  send(roomId: string, message: PartyMessage): void {
    const socket = this.connections.get(roomId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  /**
   * Disconnect from a room
   */
  disconnect(roomId: string): void {
    const socket = this.connections.get(roomId);
    if (socket) {
      socket.close();
      this.connections.delete(roomId);
      this.handlers.delete(roomId);
    }
  }

  /**
   * Disconnect from all rooms
   */
  disconnectAll(): void {
    for (const [roomId] of this.connections) {
      this.disconnect(roomId);
    }
  }
}

// Singleton instance
export const partyManager = new PartyConnectionManager();
