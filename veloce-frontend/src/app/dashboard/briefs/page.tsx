import Link from "next/link";
import { BriefsList } from "@/components/briefs-list";

export default function BriefsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Briefs
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Open a row for the full detail view (submission, AI analysis, notes,
        timeline).
      </p>
      <div className="mt-8">
        <BriefsList />
      </div>
      <p className="mt-6 text-xs text-zinc-500">
        Need the form?{" "}
        <Link
          href="/intake"
          className="font-medium text-emerald-700 underline dark:text-emerald-400"
        >
          Submit a new brief
        </Link>
        .
      </p>
    </div>
  );
}
