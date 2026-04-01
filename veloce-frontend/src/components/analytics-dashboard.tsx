"use client";

import { useMemo } from "react";
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
import { useVeloce } from "@/lib/veloce-store";
import {
  PIPELINE_STAGES,
  budgetTierMidUsd,
  stageLabel,
  type PipelineStage,
} from "@/types/veloce";

const ACTIVE_STAGES: PipelineStage[] = [
  "new",
  "under_review",
  "proposal_sent",
];

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function AnalyticsDashboard() {
  const { briefs, analyses } = useVeloce();

  const byStage = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      stage: stageLabel(stage),
      count: briefs.filter((b) => b.stage === stage).length,
    }));
  }, [briefs]);

  const conversion = useMemo(() => {
    const total = briefs.length;
    const won = briefs.filter((b) => b.stage === "won").length;
    return {
      rate: total ? Math.round((won / total) * 1000) / 10 : 0,
      won,
      total,
    };
  }, [briefs]);

  const pipelineRevenue = useMemo(() => {
    return briefs
      .filter((b) => ACTIVE_STAGES.includes(b.stage))
      .reduce((sum, b) => sum + budgetTierMidUsd(b.budgetTier), 0);
  }, [briefs]);

  const complexityOverTime = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    for (const b of briefs) {
      const a = analyses.get(b.id);
      if (!a) continue;
      const key = monthKey(b.submittedAt);
      const cur = map.get(key) ?? { sum: 0, n: 0 };
      cur.sum += a.complexity;
      cur.n += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { sum, n }]) => ({
        month,
        avgComplexity: Math.round((sum / n) * 10) / 10,
      }));
  }, [briefs, analyses]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of briefs) {
      const a = analyses.get(b.id);
      if (!a) continue;
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [briefs, analyses]);

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
