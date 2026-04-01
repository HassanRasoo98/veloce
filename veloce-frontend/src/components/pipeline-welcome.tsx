"use client";

import { useSearchParams } from "next/navigation";

export function PipelineWelcome() {
  const search = useSearchParams();
  if (search.get("welcome") !== "1") return null;

  return (
    <div
      className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
      role="status"
    >
      New brief added from intake with mock AI analysis. It appears in{" "}
      <strong>New</strong>.
    </div>
  );
}
