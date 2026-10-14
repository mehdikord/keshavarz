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
import { Input } from "@/components/ui/input";
import { ADMIN_NAV_GROUPS } from "@/components/admin-panel/shell/admin-nav";
import { useAdminSession } from "@/hooks/admin/use-admin-session";
import { useAdminShellStore } from "@/stores/admin-shell-store";

function resolveBreadcrumbs(pathname: string) {
  const crumbs: { href: string; label: string }[] = [
    { href: "/admins", label: "مدیریت" },
  ];

  if (pathname === "/admins" || pathname === "/admins/dashboard") {
    return [{ href: "/admins", label: "داشبورد" }];
  }

  const allItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
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

      <div className="relative hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          disabled
          placeholder="جستجوی سراسری (فاز بعد)"
          className="h-9 rounded-lg bg-muted/40 pr-9 text-sm"
          aria-label="جستجوی سراسری"
        />
      </div>

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
