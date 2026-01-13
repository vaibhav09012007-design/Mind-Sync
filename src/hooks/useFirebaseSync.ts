import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, writeBatch } from "firebase/firestore";

export function useFirebaseSync() {
  const { 
    // We need to access the store's "set" methods to update local state from server
    // But zustand's `useStore` only gives us state slices.
    // We will use the direct `useStore.setState` API for bulk updates.
  } = useStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      console.log("Syncing data for user:", user.uid);
      const userId = user.uid;

      // 1. Subscribe to Tasks
      const tasksUnsub = onSnapshot(collection(db, "users", userId, "tasks"), (snapshot) => {
        const serverTasks = snapshot.docs.map(doc => doc.data());
        // Merge strategy: Server wins for simplicity in this prototype
        useStore.setState((state) => ({
            ...state,
            tasks: serverTasks as any // Type assertion for brevity, real app needs validation
        }));
      });

      // 2. Subscribe to Events
      const eventsUnsub = onSnapshot(collection(db, "users", userId, "events"), (snapshot) => {
        const serverEvents = snapshot.docs.map(doc => doc.data());
        useStore.setState((state) => ({
            ...state,
            events: serverEvents as any
        }));
      });

      // 3. Subscribe to Notes
      const notesUnsub = onSnapshot(collection(db, "users", userId, "notes"), (snapshot) => {
        const serverNotes = snapshot.docs.map(doc => doc.data());
        useStore.setState((state) => ({
            ...state,
            notes: serverNotes as any
        }));
      });

      return () => {
        tasksUnsub();
        eventsUnsub();
        notesUnsub();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  // Note: This hook currently implements "One-Way Sync" (Server -> Client).
  // To implement Client -> Server, we need to modify the Store actions to write to Firebase.
  // I will update the store middleware next.
}
