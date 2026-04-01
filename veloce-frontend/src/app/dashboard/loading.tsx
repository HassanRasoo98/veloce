export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-72 min-w-[200px] flex-1 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
