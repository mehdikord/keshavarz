"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Menu as MenuIcon, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TooltipProvider } from "@/components/admin/ui/tooltip";
import { formatDate, formatWeekday } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import { type AdminViewerSummary, AdminViewerProvider } from "./admin-context";
import { CommandPalette } from "./command-palette";
import { ADMIN_SIDEBAR_COOKIE } from "./constants";
import { SidebarContent } from "./sidebar";
import { ThemeMenu } from "./theme-menu";

export function AdminShell({
  children,
  initialCollapsed,
  renderedAt,
  viewer,
}: {
  children: React.ReactNode;
  initialCollapsed: boolean;
  /** Server time of the request, so the header date matches on server and client. */
  renderedAt: string;
  viewer: AdminViewerSummary;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const today = new Date(renderedAt);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // A route change closes the mobile drawer.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      document.cookie = `${ADMIN_SIDEBAR_COOKIE}=${next ? "1" : "0"}; Path=/admins; Max-Age=31536000; SameSite=Lax`;
      return next;
    });
  }

  return (
    <AdminViewerProvider viewer={viewer}>
      <TooltipProvider delayDuration={250}>
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
          href="#admin-main"
        >
          رفتن به محتوای اصلی
        </a>

        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-30 hidden transition-[width] duration-200 lg:block",
            collapsed ? "w-[76px]" : "w-[264px]",
          )}
        >
          <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <DialogPrimitive.Root onOpenChange={setMobileOpen} open={mobileOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#07110b]/55 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
            <DialogPrimitive.Content
              className="fixed inset-y-0 right-0 z-50 w-[280px] max-w-[85vw] shadow-[var(--a-shadow-pop)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right lg:hidden"
              dir="rtl"
            >
              <DialogPrimitive.Title className="sr-only">منوی پنل</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">بخش‌های پنل مدیریت</DialogPrimitive.Description>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <div className={cn("min-w-0 transition-[padding] duration-200", collapsed ? "lg:pr-[76px]" : "lg:pr-[264px]")}>
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-2 px-4 sm:px-6 lg:px-8">
              <button
                aria-label="باز کردن منو"
                className="-mr-1 flex size-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <MenuIcon className="size-5" />
              </button>

              <button
                className="group flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-background px-3 text-[13px] text-muted-foreground transition-colors hover:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setPaletteOpen(true)}
                type="button"
              >
                <Search className="size-4" />
                <span className="flex-1 truncate text-start">جستجوی کاربر یا رفتن به صفحه…</span>
                <kbd className="hidden rounded-md border border-border bg-raised px-1.5 py-0.5 text-[10.5px] font-medium sm:inline" dir="ltr">
                  Ctrl K
                </kbd>
              </button>

              <div className="mr-auto flex items-center gap-1.5">
                <div className="hidden text-left leading-tight xl:block">
                  <p className="text-[12.5px] font-semibold text-foreground">{formatWeekday(today)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(today)}</p>
                </div>
                <span aria-hidden className="mx-2 hidden h-6 w-px bg-border xl:block" />
                <ThemeMenu />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1480px] px-4 pt-6 pb-16 outline-none sm:px-6 lg:px-8" id="admin-main" tabIndex={-1}>
            {children}
          </main>
        </div>

        <CommandPalette onOpenChange={setPaletteOpen} open={paletteOpen} />
      </TooltipProvider>
    </AdminViewerProvider>
  );
}
