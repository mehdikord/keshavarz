"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  House,
  LogOut,
  Settings,
  Sprout,
  UserRound,
} from "lucide-react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAppMenuStore } from "@/stores/app-menu-store";
import { useAuthStore } from "@/stores/auth-store";

interface MenuItem {
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  requiresAuth?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "صفحه اصلی",
    description: "انتخاب پنل کاربری",
    href: "/",
    icon: House,
  },
  {
    label: "پروفایل و تنظیمات",
    description: "ویرایش نام و مدیریت حساب",
    href: "/profile",
    icon: Settings,
    requiresAuth: true,
  },
];

export function AppMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useAppMenuStore((state) => state.isOpen);
  const close = useAppMenuStore((state) => state.close);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    void logout().finally(() => {
      close();
      toast.info("خروج از حساب");
      router.replace("/auth");
    });
  };

  const handleItemClick = (
    event: React.MouseEvent,
    item: MenuItem,
  ) => {
    if (item.requiresAuth && !isAuthenticated) {
      event.preventDefault();
      close();
      toast.info("ابتدا وارد شوید");
      router.push("/auth");
      return;
    }

    close();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(100%,320px)] border-l border-primary/10 bg-gradient-to-b from-background via-background to-muted/40 p-0"
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(45,106,79,0.12),transparent_45%)]" />

          <SheetHeader className="relative border-b border-border/60 bg-gradient-to-l from-primary/10 to-transparent px-5 py-6 text-right">
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <UserAvatar name={user.displayName} size="lg" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-lg">
                  {isAuthenticated && user ? user.displayName : "مهمان"}
                </SheetTitle>
                <SheetDescription className="truncate text-xs">
                  {isAuthenticated && user
                    ? user.phone
                    : "برای دسترسی کامل وارد شوید"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
              منوی سیستم
            </p>

            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => handleItemClick(event, item)}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200",
                    isActive
                      ? "border-primary/25 bg-primary/10 shadow-sm"
                      : "border-transparent bg-surface/80 hover:border-primary/15 hover:bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-primary group-hover:bg-primary/15",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                    {item.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <ChevronLeft
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5",
                      isActive && "text-primary",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="relative space-y-3 border-t border-border/60 bg-surface/60 px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
              <Sprout className="size-4 shrink-0 text-primary" />
              <span>کشاورز — پلتفرم خدمات کشاورزی</span>
            </div>

            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                خروج از حساب
              </Button>
            ) : (
              <Button
                asChild
                className="h-11 w-full rounded-xl"
                onClick={close}
              >
                <Link href="/auth">ورود به حساب</Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
