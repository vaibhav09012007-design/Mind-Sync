import { StatsSkeleton, TaskListSkeleton } from "@/components/skeleton-loaders";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <StatsSkeleton />
      <TaskListSkeleton count={5} />
    </div>
  );
}
