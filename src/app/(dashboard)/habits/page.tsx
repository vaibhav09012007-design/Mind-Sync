import { Suspense } from "react";
import { getCachedHabits, getCachedHabitLogs } from "@/lib/data-fetchers";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HabitCard } from "@/components/habits/habit-card";
import { CreateHabitButton } from "@/components/habits/create-habit-button";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/ui/page-transition";
import { format } from "date-fns";

export const metadata = {
  title: "Habit Tracker | Mind-Sync",
  description: "Build and track your daily habits.",
};

async function HabitsList() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [habits, logs] = await Promise.all([
    getCachedHabits(userId),
    getCachedHabitLogs(userId, 7), // Fetch last 7 days of logs
  ]);

  const today = format(new Date(), "yyyy-MM-dd");

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">No habits yet</h3>
        <p className="text-muted-foreground max-w-sm mb-8">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
        </p>
        <CreateHabitButton />
      </div>
    );
  }

  // Organize habits by time of day
  const timeOfDayGroups = {
    morning: habits.filter((h) => h.timeOfDay === "morning"),
    afternoon: habits.filter((h) => h.timeOfDay === "afternoon"),
    evening: habits.filter((h) => h.timeOfDay === "evening"),
    anytime: habits.filter((h) => h.timeOfDay === "anytime"),
  };

  const sections = [
    { id: "morning", title: "Morning", icon: "🌅", items: timeOfDayGroups.morning },
    { id: "afternoon", title: "Afternoon", icon: "☀️", items: timeOfDayGroups.afternoon },
    { id: "evening", title: "Evening", icon: "🌙", items: timeOfDayGroups.evening },
    { id: "anytime", title: "Anytime", icon: "✨", items: timeOfDayGroups.anytime },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        if (section.items.length === 0) return null;

        return (
          <div key={section.id} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">{section.icon}</span> {section.title}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.items.map((habit) => {
                // Check if completed today
                const isCompletedToday = logs.some(
                  (log) => log.habitId === habit.id && log.date === today
                );

                // Get recent logs for this habit
                const recentLogs = logs
                  .filter((log) => log.habitId === habit.id)
                  .map((log) => log.date);

                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completedToday={isCompletedToday}
                    recentLogs={recentLogs}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HabitsPage() {
  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Habit Tracker</h1>
            <p className="text-muted-foreground">Build consistency and track your progress.</p>
          </div>
          <CreateHabitButton />
        </div>

        <Separator className="my-2" />

        <Suspense fallback={<div className="grid gap-4 md:grid-cols-3"><div className="h-32 rounded-xl bg-muted/50 animate-pulse" /><div className="h-32 rounded-xl bg-muted/50 animate-pulse" /><div className="h-32 rounded-xl bg-muted/50 animate-pulse" /></div>}>
          <HabitsList />
        </Suspense>
      </div>
    </PageTransition>
  );
}
