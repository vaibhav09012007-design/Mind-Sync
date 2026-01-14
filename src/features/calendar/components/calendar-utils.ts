import { GridEvent } from "./TimeGrid";

// Activity type colors - glassmorphism style
export const EVENT_STYLES = {
  work: {
    bg: "bg-blue-500/15 backdrop-blur-sm",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    label: "Deep Work",
  },
  meeting: {
    bg: "bg-purple-500/15 backdrop-blur-sm",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
    label: "Meeting",
  },
  personal: {
    bg: "bg-emerald-500/15 backdrop-blur-sm",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Personal",
  },
  break: {
    bg: "bg-amber-500/15 backdrop-blur-sm",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    label: "Break",
  },
  shallow: {
    bg: "bg-slate-400/15 backdrop-blur-sm",
    border: "border-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    label: "Shallow Work",
  },
};

// Calculate overlapping groups for side-by-side rendering
export function calculateEventLayout(
  events: GridEvent[]
): Map<string, { column: number; totalColumns: number }> {
  const layout = new Map<string, { column: number; totalColumns: number }>();

  if (events.length === 0) return layout;

  // Sort by start time
  const sorted = [...events].sort((a, b) => a.start - b.start);

  // Group overlapping events
  const groups: GridEvent[][] = [];
  let currentGroup: GridEvent[] = [];

  for (const event of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      // Check if overlaps with any event in current group
      const overlaps = currentGroup.some((e) => {
        const eEnd = e.start + e.duration;
        const eventEnd = event.start + event.duration;
        return event.start < eEnd && eventEnd > e.start;
      });

      if (overlaps) {
        currentGroup.push(event);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Assign columns within each group
  for (const group of groups) {
    const totalColumns = group.length;
    group.forEach((event, index) => {
      layout.set(event.id, { column: index, totalColumns });
    });
  }

  return layout;
}
