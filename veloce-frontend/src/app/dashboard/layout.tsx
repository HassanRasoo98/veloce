import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col border-t border-zinc-200 dark:border-zinc-800">
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
