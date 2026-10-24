"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  House,
  Inbox,
  LandPlot,
  LayoutDashboard,
  LogIn,
  LogOut,
  PieChart,
  Search,
  Settings,
  Sprout,
  Tractor,
  Wheat,
  Wrench,
  X,
} from "lucide-react";

import { FieldHills } from "@/components/shared/field-hills";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { formatPhoneDisplay } from "@/lib/utils/phone";
import { useAppMenuStore } from "@/stores/app-menu-store";
import { useAuthStore } from "@/stores/auth-store";

type Panel = "provider" | "consumer";

interface MenuLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const PANEL_LINKS: Record<Panel, MenuLink[]> = {
  provider: [
    { label: "داشبورد", href: "/providers/home", icon: LayoutDashboard },
    { label: "درخواست‌ها", href: "/providers/requests", icon: Inbox },
    { label: "ارائه خدمات", href: "/providers/services", icon: Wrench },
    { label: "گزارش‌ها", href: "/providers/reports", icon: BarChart3 },
    { label: "اشتراک", href: "/providers/subscription", icon: CreditCard },
  ],
  consumer: [
    { label: "داشبورد", href: "/users/home", icon: LayoutDashboard },
    { label: "جستجوی خدمات", href: "/users/search", icon: Search },
    { label: "درخواست‌های من", href: "/users/requests", icon: ClipboardList },
    { label: "زمین‌های من", href: "/users/lands", icon: LandPlot },
    { label: "گزارش هزینه‌ها", href: "/users/reports", icon: PieChart },
  ],
};

const PANELS: Record<
  Panel,
  { label: string; hint: string; href: string; icon: typeof Tractor; active: string; idle: string; iconBox: string }
> = {
  provider: {
    label: "خدمات‌دهنده",
    hint: "ارائه خدمات",
    href: "/providers/home",
    icon: Tractor,
    active: "bg-[linear-gradient(150deg,#123d2b_0%,#2d7a55_100%)] text-white shadow-[0_14px_28px_-16px_rgba(18,61,43,0.8)]",
    idle: "bg-[#eef5ef] text-[#1f5c41] ring-1 ring-[#d4e6d9]",
    iconBox: "bg-white/15",
  },
  consumer: {
    label: "خدمات‌گیرنده",
    hint: "دریافت خدمات",
    href: "/users/home",
    icon: Wheat,
    active: "bg-[linear-gradient(150deg,#f9b46b_0%,#c9611f_100%)] text-white shadow-[0_14px_28px_-16px_rgba(185,83,31,0.8)]",
    idle: "bg-[#fff5e6] text-[#9a4f12] ring-1 ring-[#f3dcb8]",
    iconBox: "bg-white/20",
  },
};

function currentPanel(pathname: string): Panel | null {
  if (pathname === "/providers" || pathname.startsWith("/providers/")) return "provider";
  if (pathname === "/users" || pathname.startsWith("/users/")) return "consumer";
  return null;
}

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useAppMenuStore((state) => state.isOpen);
  const close = useAppMenuStore((state) => state.close);
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const panel = currentPanel(pathname);
  const panelLinks = panel ? PANEL_LINKS[panel] : [];
  const accent = panel === "consumer" ? "consumer" : "provider";

  const handleLogout = () => {
    void logout().finally(() => {
      close();
      toast.info("از حساب خارج شدید");
      router.replace("/auth");
    });
  };

  const guard = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
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
        className="w-[min(88%,340px)] gap-0 overflow-hidden border-0 bg-[#f8faf5] p-0 shadow-[-24px_0_60px_-20px_rgba(7,29,20,0.45)] sm:max-w-none"
      >
        <div className="flex h-full flex-col">
          <section className="relative isolate shrink-0 overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_50%,#1f5a40_100%)] px-5 pb-16 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
              <div className="absolute -left-16 -top-20 size-60 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.3)_0%,transparent_65%)]" />
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#95d5b2] to-[#40916c] text-[#0b2a1c]">
                  <Sprout className="size-5" strokeWidth={2} />
                </span>
                <span className="text-[15px] font-black">کشاورز</span>
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="بستن منو"
                className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20 active:scale-90"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-[#b7e4c7] to-[#f4a261] p-[2px]">
                {isAuthenticated && user ? (
                  <UserAvatar name={user.displayName} src={image} size="lg" className="border-2 border-[#0f3324]" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full border-2 border-[#0f3324] bg-white/10">
                    <Sprout className="size-6" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-[17px] font-black text-white">
                  {isAuthenticated && user ? user.displayName : "کاربر مهمان"}
                </SheetTitle>
                <SheetDescription dir={isAuthenticated ? "ltr" : undefined} className="truncate text-right text-[12px] text-white/65">
                  {isAuthenticated && user
                    ? toPersianDigits(formatPhoneDisplay(user.phone))
                    : "برای دسترسی کامل وارد شوید"}
                </SheetDescription>
              </div>
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  onClick={close}
                  aria-label="پروفایل و تنظیمات"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <Settings className="size-[18px]" />
                </Link>
              ) : null}
            </div>
            <FieldHills />
          </section>

          <nav className="relative z-10 -mt-3 min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-1">
            <div>
              <p className="mb-2 px-1 text-[11px] font-black text-[#5c6b5c]">پنل‌ها</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PANELS) as Panel[]).map((key) => {
                  const config = PANELS[key];
                  const Icon = config.icon;
                  const active = panel === key;
                  return (
                    <Link
                      key={key}
                      href={config.href}
                      onClick={guard}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex flex-col gap-3 overflow-hidden rounded-[20px] p-3 transition-transform active:scale-[0.97]",
                        active ? config.active : config.idle,
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          active ? config.iconBox : "bg-white",
                        )}
                      >
                        <Icon className="size-5" strokeWidth={1.9} />
                      </span>
                      <span>
                        <span className="block text-[13px] font-black">{config.label}</span>
                        <span className={cn("block text-[10.5px]", active ? "text-white/75" : "opacity-70")}>
                          {active ? "پنل فعلی" : config.hint}
                        </span>
                      </span>
                      {active ? (
                        <motion.span
                          layoutId="menu-panel-dot"
                          className="absolute left-3 top-3 size-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.25)]"
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            {panelLinks.length > 0 ? (
              <div>
                <p className="mb-2 px-1 text-[11px] font-black text-[#5c6b5c]">
                  {panel === "provider" ? "پنل خدمات‌دهنده" : "پنل خدمات‌گیرنده"}
                </p>
                <ul className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[#e3ebe3]">
                  {panelLinks.map((item, index) => {
                    const Icon = item.icon;
                    const active = isLinkActive(pathname, item.href);
                    return (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + index * 0.04, duration: 0.25 }}
                        className={cn(index > 0 && "border-t border-[#eef2ee]")}
                      >
                        <Link
                          href={item.href}
                          onClick={guard}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-3 transition-colors",
                            active
                              ? accent === "consumer"
                                ? "bg-[#fff5e6]"
                                : "bg-[#eef5ef]"
                              : "hover:bg-[#f6f8f4]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                              active
                                ? accent === "consumer"
                                  ? "bg-[#b9531f] text-white"
                                  : "bg-[#2d6a4f] text-white"
                                : "bg-[#f1f5f0] text-[#4a5d4a]",
                            )}
                          >
                            <Icon className="size-[18px]" strokeWidth={1.9} />
                          </span>
                          <span className={cn("flex-1 text-[13.5px]", active ? "font-black text-[#1a2e1a]" : "font-bold text-[#334433]")}>
                            {item.label}
                          </span>
                          <ChevronLeft className={cn("size-4", active ? "text-[#1a2e1a]" : "text-[#a8b5a8]")} />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="mb-2 px-1 text-[11px] font-black text-[#5c6b5c]">عمومی</p>
              <ul className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[#e3ebe3]">
                {[
                  { label: "صفحه اصلی", href: "/", icon: House },
                  { label: "پروفایل و تنظیمات", href: "/profile", icon: Settings },
                ].map((item, index) => {
                  const Icon = item.icon;
                  const active = item.href === "/" ? pathname === "/" : isLinkActive(pathname, item.href);
                  return (
                    <li key={item.href} className={cn(index > 0 && "border-t border-[#eef2ee]")}>
                      <Link
                        href={item.href}
                        onClick={item.href === "/" ? close : guard}
                        aria-current={active ? "page" : undefined}
                        className={cn("flex items-center gap-3 px-3.5 py-3 transition-colors", active ? "bg-[#eef5ef]" : "hover:bg-[#f6f8f4]")}
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-[#2d6a4f] text-white" : "bg-[#f1f5f0] text-[#4a5d4a]",
                          )}
                        >
                          <Icon className="size-[18px]" strokeWidth={1.9} />
                        </span>
                        <span className={cn("flex-1 text-[13.5px]", active ? "font-black text-[#1a2e1a]" : "font-bold text-[#334433]")}>
                          {item.label}
                        </span>
                        <ChevronLeft className="size-4 text-[#a8b5a8]" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div className="shrink-0 border-t border-[#e3ebe3] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#fde2dc]/60 text-[13.5px] font-black text-[#b23a1f] transition-colors hover:bg-[#fde2dc]"
              >
                <LogOut className="size-4" />
                خروج از حساب
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={close}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2d6a4f] text-[13.5px] font-black text-white"
              >
                <LogIn className="size-4" />
                ورود به حساب
              </Link>
            )}
            <p className="mt-2.5 text-center text-[10.5px] text-[#8a978a]">کشاورز · همراه کشاورزان، از کاشت تا برداشت</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
