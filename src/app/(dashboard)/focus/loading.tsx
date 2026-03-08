import { Skeleton } from "@/components/skeleton-loaders";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <Skeleton className="h-48 w-48 rounded-full" />
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
