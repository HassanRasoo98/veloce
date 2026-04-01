"use client";

import Link from "next/link";
import { useVeloce } from "@/lib/veloce-store";
import { budgetTierLabel, stageLabel } from "@/types/veloce";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BriefsList() {
  const { visibleBriefs, analyses } = useVeloce();
  const sorted = [...visibleBriefs].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Title
            </th>
            <th className="hidden px-4 py-3 font-semibold text-zinc-700 sm:table-cell dark:text-zinc-300">
              Stage
            </th>
            <th className="hidden px-4 py-3 font-semibold text-zinc-700 md:table-cell dark:text-zinc-300">
              Category
            </th>
            <th className="hidden px-4 py-3 font-semibold text-zinc-700 lg:table-cell dark:text-zinc-300">
              Budget
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => {
            const a = analyses.get(b.id);
            return (
              <tr
                key={b.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/briefs/${b.id}`}
                    className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {b.title}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell dark:text-zinc-400">
                  {stageLabel(b.stage)}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">
                  {a?.category ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 lg:table-cell dark:text-zinc-400">
                  {budgetTierLabel(b.budgetTier)}
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatWhen(b.submittedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">
          No briefs visible for this role. Switch to Admin or open Pipeline.
        </p>
      ) : null}
    </div>
  );
}
