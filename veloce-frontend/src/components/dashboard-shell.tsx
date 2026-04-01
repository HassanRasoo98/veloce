"use client";

import type { ReactNode } from "react";
import { AuthBar } from "@/components/auth-bar";
import { DashboardNav } from "@/components/dashboard-nav";
import { useAuth } from "@/lib/auth-context";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <>
      <div className="border-b border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <AuthBar />
          {user ? <DashboardNav /> : null}
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading session…</p>
        ) : !user ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Sign in required
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Use the form above to access the pipeline, briefs, and analytics. Start
              the API and run the user seed script if you have not already.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </>
  );
}
