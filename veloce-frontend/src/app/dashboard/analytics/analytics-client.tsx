"use client";

import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics-dashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    ),
  },
);

export function AnalyticsClient() {
  return <AnalyticsDashboard />;
}
