import { AnalyticsClient } from "./analytics-client";

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Aggregates from in-memory mock data (all briefs in the session).
      </p>
      <div className="mt-8">
        <AnalyticsClient />
      </div>
    </div>
  );
}
