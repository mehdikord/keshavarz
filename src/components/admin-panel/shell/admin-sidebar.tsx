"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Sprout, X } from "lucide-react";

import {
  ADMIN_NAV_GROUPS,
  isAdminNavActive,
} from "@/components/admin-panel/shell/admin-nav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { cn } from "@/lib/utils";
import { useAdminShellStore } from "@/stores/admin-shell-store";
import { useMemo } from "react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { can } = useAdminPermissions();
  const collapsed = useAdminShellStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useAdminShellStore((s) => s.mobileNavOpen);
  const toggleSidebarCollapsed = useAdminShellStore(
    (s) => s.toggleSidebarCollapsed,
  );
  const setMobileNavOpen = useAdminShellStore((s) => s.setMobileNavOpen);

  const navGroups = useMemo(
    () =>
      ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => can(item.permission)),
      })).filter((group) => group.items.length > 0),
    [can],
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />

      <aside
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col border-l border-white/5 bg-[var(--admin-sidebar)] text-[var(--admin-sidebar-foreground)] transition-[width,transform] duration-200",
          "w-[var(--admin-sidebar-width)]",
          collapsed && "lg:w-[var(--admin-sidebar-collapsed)]",
          mobileNavOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-[var(--admin-topbar-height)] items-center gap-2 px-3">
          <Link
            href="/admins"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--admin-sidebar-hover)]"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </span>
            {!collapsed ? (
              <span className="truncate text-sm font-semibold tracking-tight">
                کشاورز · مدیریت
              </span>
            ) : null}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-[var(--admin-sidebar-foreground)] hover:bg-[var(--admin-sidebar-hover)] hover:text-white lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="بستن منو"
          >
            <X className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-9 shrink-0 text-[var(--admin-sidebar-muted)] hover:bg-[var(--admin-sidebar-hover)] hover:text-white lg:inline-flex"
            onClick={toggleSidebarCollapsed}
            aria-label={collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>

        <Separator className="bg-white/10" />

        <ScrollArea className="min-h-0 flex-1 px-2 py-3">
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-[var(--admin-sidebar-muted)] uppercase">
                    {group.title}
                  </p>
                ) : (
                  <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isAdminNavActive(pathname, item.href);
                    const Icon = item.icon;
                    const link = (
                      <Link
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-[var(--admin-sidebar-active)] text-white"
                            : "text-[var(--admin-sidebar-foreground)]/85 hover:bg-[var(--admin-sidebar-hover)] hover:text-white",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="size-4 shrink-0 opacity-90" />
                        {!collapsed ? (
                          <span className="truncate">{item.title}</span>
                        ) : null}
                      </Link>
                    );

                    if (!collapsed) {
                      return <li key={item.href}>{link}</li>;
                    }

                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="left">{item.title}</TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
