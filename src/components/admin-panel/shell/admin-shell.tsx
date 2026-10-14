"use client";

import { AdminSidebar } from "@/components/admin-panel/shell/admin-sidebar";
import { AdminTopbar } from "@/components/admin-panel/shell/admin-topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAdminShellStore } from "@/stores/admin-shell-store";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const collapsed = useAdminShellStore((s) => s.sidebarCollapsed);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        data-admin-console=""
        className="min-h-dvh bg-[var(--admin-canvas)] text-foreground"
      >
        <AdminSidebar />
        <div
          className={cn(
            "flex min-h-dvh flex-col transition-[padding] duration-200",
            "lg:pr-[var(--admin-sidebar-width)]",
            collapsed && "lg:pr-[var(--admin-sidebar-collapsed)]",
          )}
        >
          <AdminTopbar />
          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
