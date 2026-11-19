"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, Search, UserRound } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ADMIN_ACCOUNT_ITEMS,
  ADMIN_NAV_GROUPS,
} from "@/components/admin-panel/shell/admin-nav";
import { useAdminSession } from "@/hooks/admin/use-admin-session";
import { useAdminShellStore } from "@/stores/admin-shell-store";

function resolveBreadcrumbs(pathname: string) {
  const crumbs: { href: string; label: string }[] = [
    { href: "/admins", label: "مدیریت" },
  ];

  if (pathname === "/admins" || pathname === "/admins/dashboard") {
    return [{ href: "/admins", label: "داشبورد" }];
  }

  const allItems = [
    ...ADMIN_NAV_GROUPS.flatMap((group) => group.items),
    ...ADMIN_ACCOUNT_ITEMS,
  ];
  const exact = allItems.find((item) => item.href === pathname);
  if (exact) {
    crumbs.push({ href: exact.href, label: exact.title });
    return crumbs;
  }

  const nested = allItems
    .filter((item) => item.href !== "/admins" && pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (nested) {
    crumbs.push({ href: nested.href, label: nested.title });
    crumbs.push({ href: pathname, label: "جزئیات" });
    return crumbs;
  }

  crumbs.push({ href: pathname, label: "صفحه" });
  return crumbs;
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { admin, logout, logoutAll } = useAdminSession();
  const setMobileNavOpen = useAdminShellStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useAdminShellStore((s) => s.setCommandPaletteOpen);
  const breadcrumbs = resolveBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--admin-topbar-height)] items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-topbar)]/95 px-4 backdrop-blur supports-backdrop-filter:bg-[var(--admin-topbar)]/80 lg:px-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="باز کردن منو"
      >
        <Menu className="size-4" />
      </Button>

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-wrap sm:flex-nowrap">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={`${crumb.href}-${index}`} className="contents">
                {index > 0 ? (
                  <BreadcrumbSeparator>
                    <ChevronLeft className="size-3.5" />
                  </BreadcrumbSeparator>
                ) : null}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="max-w-[12rem] truncate sm:max-w-none">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <Button
        type="button"
        variant="outline"
        className="h-9 shrink-0 gap-2 rounded-lg px-2.5 text-muted-foreground md:w-64 md:justify-start md:bg-muted/40"
        onClick={() => setCommandPaletteOpen(true)}
        aria-label="جستجوی سراسری"
        aria-keyshortcuts="Control+K"
      >
        <Search className="size-4" />
        <span className="hidden flex-1 text-start text-sm font-normal md:inline">
          جستجو...
        </span>
        <kbd
          className="hidden rounded border border-[var(--admin-border)] bg-background px-1.5 py-0.5 font-mono text-[10px] md:inline"
          dir="ltr"
        >
          Ctrl K
        </kbd>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg"
          >
            <UserRound className="size-4" />
            <span className="hidden max-w-[8rem] truncate sm:inline">
              {admin?.name ?? "حساب مدیر"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="truncate">{admin?.name ?? "مدیر"}</p>
            <p className="truncate font-normal text-muted-foreground" dir="ltr">
              {admin?.phone}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admins/me">پروفایل</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admins/me/change-password">تغییر رمز</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admins/me/sessions">نشست‌های فعال</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void logout();
            }}
          >
            خروج از این دستگاه
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              void logoutAll();
            }}
          >
            خروج از همه دستگاه‌ها
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
