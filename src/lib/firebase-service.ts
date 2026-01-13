import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Task, CalendarEvent, Note } from "@/store/useStore";

export const FirebaseService = {
  // --- Tasks ---
  async saveTask(userId: string, task: Task) {
    await setDoc(doc(db, "users", userId, "tasks", task.id), task);
  },

  async deleteTask(userId: string, taskId: string) {
    await deleteDoc(doc(db, "users", userId, "tasks", taskId));
  },

  // --- Events ---
  async saveEvent(userId: string, event: CalendarEvent) {
    await setDoc(doc(db, "users", userId, "events", event.id), event);
  },

  async deleteEvent(userId: string, eventId: string) {
    await deleteDoc(doc(db, "users", userId, "events", eventId));
  },

  // --- Notes ---
  async saveNote(userId: string, note: Note) {
    await setDoc(doc(db, "users", userId, "notes", note.id), note);
  },

  async deleteNote(userId: string, noteId: string) {
    await deleteDoc(doc(db, "users", userId, "notes", noteId));
  },

  // --- Real-time Listeners ---
  subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const q = query(collection(db, "users", userId, "tasks"));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      callback(tasks);
    });
  }
};
