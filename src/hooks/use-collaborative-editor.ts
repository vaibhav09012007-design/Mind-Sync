"use client";

/**
 * Hook for collaborative Tiptap editing via Yjs + PartyKit
 * Creates a Yjs document per note, synced through a PartyKit room
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { Collaboration } from "@tiptap/extension-collaboration";
import { useUser } from "@clerk/nextjs";
import { getPresenceColor } from "@/lib/party-client";

interface UseCollaborativeEditorOptions {
  noteId: string;
  enabled?: boolean;
}

interface CollaborativeEditorState {
  /** Tiptap extensions to add for collaboration */
  extensions: ReturnType<typeof Collaboration.configure>[];
  /** Whether the Yjs provider is connected and synced */
  isSynced: boolean;
  /** Whether collaboration is active */
  isCollaborative: boolean;
  /** Cleanup function (call on unmount if needed) */
  destroy: () => void;
}

export function useCollaborativeEditor({
  noteId,
  enabled = true,
}: UseCollaborativeEditorOptions): CollaborativeEditorState {
  const { user } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const colorRef = useRef(getPresenceColor());

  // Create Yjs doc and provider — stable across renders
  const { ydoc, provider } = useMemo(() => {
    if (!enabled || !noteId) {
      return { ydoc: null, provider: null };
    }

    const doc = new Y.Doc();
    const host =
      typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999")
        : "localhost:1999";

    const prov = new YPartyKitProvider(host, `note-${noteId}`, doc, {
      connect: true,
    });

    docRef.current = doc;
    providerRef.current = prov;

    return { ydoc: doc, provider: prov };
  }, [noteId, enabled]);

  // Track sync status
  useEffect(() => {
    if (!provider) return;

    const onSync = (synced: boolean) => setIsSynced(synced);

    provider.on("sync", onSync);

    // Set awareness user info for cursor colors
    if (user) {
      provider.awareness.setLocalStateField("user", {
        name: user.fullName ?? user.username ?? "Anonymous",
        color: colorRef.current,
      });
    }

    return () => {
      provider.off("sync", onSync);
    };
  }, [provider, user]);

  // Build Tiptap extensions
  const extensions = useMemo(() => {
    if (!ydoc) return [];

    return [
      Collaboration.configure({
        document: ydoc,
        field: "content",
      }),
    ];
  }, [ydoc]);

  // Cleanup function
  const destroy = () => {
    providerRef.current?.destroy();
    docRef.current?.destroy();
    providerRef.current = null;
    docRef.current = null;
    setIsSynced(false);
  };

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  return {
    extensions,
    isSynced,
    isCollaborative: enabled && !!provider,
    destroy,
  };
}
