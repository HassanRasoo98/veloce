"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { VeloceProvider } from "@/lib/veloce-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <VeloceProvider>{children}</VeloceProvider>
    </AuthProvider>
  );
}
