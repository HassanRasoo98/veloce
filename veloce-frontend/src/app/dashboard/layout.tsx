import { DashboardNav } from "@/components/dashboard-nav";
import { RoleSwitcher } from "@/components/role-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col border-t border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-200 bg-white/90 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <RoleSwitcher />
          <DashboardNav />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
