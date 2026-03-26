"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import type { InitialData } from "@/app/actions/get-initial-data";

/**
 * Hydrates the Zustand store with server-fetched data on authenticated load.
 * Ensures DB truth overwrites stale localStorage data.
 * Re-applies when initialData changes (e.g. after revalidation).
 * Renders nothing — purely a side-effect component.
 */
export function StoreHydrator({ initialData }: { initialData: InitialData | null }) {
  const prevDataRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialData) return;

    const serialized = JSON.stringify(initialData);
    if (serialized === prevDataRef.current) return;

    prevDataRef.current = serialized;
    useStore.setState({
      tasks: initialData.tasks,
      events: initialData.events,
      notes: initialData.notes,
    });
  }, [initialData]);

  return null;
}
