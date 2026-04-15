"use client";

/**
 * Hook for real-time workspace presence via PartyKit
 * Tracks which users are online and what page they're viewing
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  partyManager,
  getPresenceColor,
  type PresenceUser,
  type PartyMessage,
} from "@/lib/party-client";

interface UsePartyPresenceOptions {
  workspaceId: string | null;
  enabled?: boolean;
}

export function usePartyPresence({ workspaceId, enabled = true }: UsePartyPresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const colorRef = useRef<string>(getPresenceColor());
  const roomId = workspaceId ? `workspace-${workspaceId}` : null;

  // Build local user presence object
  const getLocalUser = useCallback((): PresenceUser | null => {
    if (!user || !isLoaded) return null;
    return {
      userId: user.id,
      name: user.fullName ?? user.username ?? "Anonymous",
      avatar: user.imageUrl ?? "",
      color: colorRef.current,
      activePage: pathname,
      lastSeen: Date.now(),
    };
  }, [user, isLoaded, pathname]);

  useEffect(() => {
    if (!enabled || !roomId || !isLoaded || !user) return;

    // Connect to the presence room
    partyManager.connect(roomId);

    // Announce join
    const localUser = getLocalUser();
    if (localUser) {
      partyManager.send(roomId, { type: "presence:join", user: localUser });
    }

    // Listen for presence messages
    const unsubscribe = partyManager.subscribe(roomId, (message: PartyMessage) => {
      switch (message.type) {
        case "presence:join":
        case "presence:update":
          setOnlineUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== message.user.userId);
            return [...filtered, message.user];
          });
          break;

        case "presence:leave":
          setOnlineUsers((prev) =>
            prev.filter((u) => u.userId !== message.userId)
          );
          break;

        case "presence:sync":
          setOnlineUsers(message.users);
          break;

        default:
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (localUser) {
        partyManager.send(roomId, {
          type: "presence:leave",
          userId: localUser.userId,
        });
      }
      partyManager.disconnect(roomId);
    };
  }, [enabled, roomId, isLoaded, user, getLocalUser]);

  // Broadcast page changes
  useEffect(() => {
    if (!roomId || !isLoaded || !user) return;

    const localUser = getLocalUser();
    if (localUser) {
      partyManager.send(roomId, { type: "presence:update", user: localUser });
    }
  }, [pathname, roomId, isLoaded, user, getLocalUser]);

  // Filter out own user from the list
  const otherUsers = onlineUsers.filter((u) => u.userId !== user?.id);

  return {
    onlineUsers,
    otherUsers,
    isConnected: !!roomId && enabled,
    totalOnline: onlineUsers.length,
  };
}
