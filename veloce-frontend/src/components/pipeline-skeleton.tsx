/** Shared loading placeholder for pipeline-style layouts (route loading + Suspense). */
export function PipelineSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="flex gap-3 overflow-hidden pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-72 min-w-[220px] flex-1 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="h-3 w-2/3 max-w-md rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
