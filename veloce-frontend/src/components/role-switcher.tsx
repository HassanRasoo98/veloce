"use client";

import { useVeloce } from "@/lib/veloce-store";
import type { Role } from "@/types/veloce";
import { MOCK_USER_ADMIN, MOCK_USER_REVIEWER } from "@/types/veloce";

export function RoleSwitcher() {
  const { role, setRole } = useVeloce();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
      <span className="font-medium text-zinc-600 dark:text-zinc-400">Mock role</span>
      <div className="flex gap-2" role="group" aria-label="Switch dashboard role">
        {(
          [
            ["admin", MOCK_USER_ADMIN.email, "Admin"],
            ["reviewer", MOCK_USER_REVIEWER.email, "Reviewer"],
          ] as const
        ).map(([value, email, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value as Role)}
            className={`rounded-md px-3 py-1.5 font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${
              role === value
                ? "bg-emerald-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
            aria-pressed={role === value}
          >
            {label}
            <span className="ml-1 hidden text-xs font-normal opacity-80 sm:inline">
              ({email})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
