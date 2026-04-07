import { useSyncExternalStore } from "react";

/**
 * Returns true once the component has hydrated on the client.
 * Uses useSyncExternalStore to avoid the react-hooks/set-state-in-effect
 * lint warning that comes from doing `useEffect(() => setMounted(true), [])`.
 */

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
