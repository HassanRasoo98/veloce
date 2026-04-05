import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        Veloce · Mock veloce-frontend
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        AI-powered project intake and estimation
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        This UI mirrors the CodeAcme full-stack assessment: a public brief form, an
        internal pipeline with Kanban and analytics, and mock roles. There is no
        backend—state lives in memory in the browser.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/intake"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
        >
          Submit a brief
        </Link>
        <Link
          href="/dashboard/pipeline"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-950"
        >
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
