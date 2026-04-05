import { PipelineSkeleton } from "@/components/pipeline-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <PipelineSkeleton />
    </div>
  );
}
