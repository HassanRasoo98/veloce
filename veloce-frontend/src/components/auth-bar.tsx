"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthBar() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("admin@veloce.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
        <div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {user.name}
          </span>
          <span className="ml-2 text-zinc-500">{user.email}</span>
          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
            {user.role}
          </span>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60"
    >
      <div>
        <label htmlFor="dash-email" className="block text-xs text-zinc-500">
          Email
        </label>
        <input
          id="dash-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          autoComplete="username"
        />
      </div>
      <div>
        <label htmlFor="dash-pass" className="block text-xs text-zinc-500">
          Password
        </label>
        <input
          id="dash-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error ? (
        <p className="w-full text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <p className="w-full text-xs text-zinc-500">
        Default after seed: admin@veloce.local / admin123 or reviewer@veloce.local /
        reviewer123
      </p>
    </form>
  );
}
