"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSummary } from "@/lib/api";
import { fetchAnalyticsSummary } from "@/lib/api";
import { useVeloce } from "@/lib/veloce-store";

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-80 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-80 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const { workspaceVersion, userId } = useVeloce();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await fetchAnalyticsSummary();
        if (!cancelled) {
          setError(null);
          setSummary(s);
        }
      } catch (e) {
        if (!cancelled) {
          setSummary(null);
          setError(
            e instanceof Error ? e.message : "Failed to load analytics",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceVersion, userId]);

  if (!userId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sign in to view analytics.
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (!summary) {
    return <AnalyticsSkeleton />;
  }

  const {
    byStage,
    conversion,
    pipelineRevenue,
    complexityOverTime,
    topCategories,
  } = summary;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Conversion
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {conversion.rate}%
          </p>
          <p className="text-xs text-zinc-500">
            {conversion.won} won / {conversion.total} total
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Pipeline revenue (est.)
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(pipelineRevenue)}
          </p>
          <p className="text-xs text-zinc-500">
            Sum of budget midpoints (New + Review + Proposal)
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Top categories
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topCategories.map((c) => (
              <li
                key={c.name}
                className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
              >
                {c.name}: {c.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Briefs by stage
          </h2>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
              <BarChart data={byStage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e4e4e7",
                  }}
                />
                <Bar dataKey="count" fill="#059669" name="Briefs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Avg. AI complexity by week
          </h2>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
              <AreaChart data={complexityOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="avgComplexity"
                  stroke="#059669"
                  fill="#6ee7b7"
                  fillOpacity={0.35}
                  name="Avg complexity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
