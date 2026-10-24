"use client";

import Link from "next/link";
import { BarChart3, Bell, LoaderCircle, Tractor } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { FieldHills } from "@/components/shared/field-hills";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface DashboardHeroProps {
  name: string;
  avatarSrc?: string | null;
  loading: boolean;
  monthlyRevenue: number;
  unreadNotifications: number;
  /** null when the provider profile does not exist yet. */
  isAvailable: boolean | null;
  isSearchable: boolean;
  togglingAvailability: boolean;
  onToggleAvailability: () => void;
}

const MONTH_NAME = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });

export function DashboardHero({
  name,
  avatarSrc,
  loading,
  monthlyRevenue,
  unreadNotifications,
  isAvailable,
  isSearchable,
  togglingAvailability,
  onToggleAvailability,
}: DashboardHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_45%,#1b5038_80%,#24603f_100%)] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
        <div className="absolute -left-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.32)_0%,transparent_65%)]" />
        <div className="absolute -right-24 top-16 size-72 rounded-full bg-[#40916c]/25 blur-3xl" />
        <Tractor
          className="absolute -left-6 top-16 size-40 rotate-[-8deg] text-white/[0.04]"
          strokeWidth={1}
        />
      </div>

      <div className="relative px-5 pb-20 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-[#b7e4c7] to-[#f4a261] p-[2px]">
              <UserAvatar name={name} src={avatarSrc} size="md" className="border-2 border-[#0f3324]" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] font-semibold text-[#95d5b2]">پنل خدمات‌دهنده</p>
              <h1 className="truncate text-lg font-black">{name}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#recent-notifications"
              aria-label="اعلان‌ها"
              className="relative flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Bell className="size-5" strokeWidth={1.75} />
              {unreadNotifications > 0 ? (
                <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f4a261] px-1 text-[10px] font-black text-[#3d2914] ring-2 ring-[#0f3324]">
                  {toPersianDigits(unreadNotifications > 9 ? "9+" : unreadNotifications)}
                </span>
              ) : null}
            </a>
            <AppMenuTrigger className="size-11 rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-white" />
          </div>
        </header>

        <div className="mt-7">
          <p className="text-[12px] font-medium text-white/60">
            درآمد {MONTH_NAME.format(new Date())}
          </p>
          {loading ? (
            <div className="mt-2 h-10 w-48 animate-pulse rounded-xl bg-white/15" />
          ) : (
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[38px] font-black leading-none tracking-tight tabular-nums">
                {new Intl.NumberFormat("fa-IR").format(monthlyRevenue)}
              </span>
              <span className="text-sm font-bold text-[#95d5b2]">تومان</span>
            </p>
          )}
          {!loading && monthlyRevenue === 0 ? (
            <p className="mt-1.5 text-[11px] text-white/55">
              هنوز کار تکمیل‌شده‌ای در این ماه ثبت نشده است
            </p>
          ) : null}
          <Link
            href="/providers/reports"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/85 ring-1 ring-white/10 transition-colors hover:bg-white/15"
          >
            <BarChart3 className="size-3.5" />
            گزارش کامل درآمد
          </Link>
        </div>

        {isAvailable !== null ? (
          <div className="mt-6 flex items-center gap-3 rounded-[24px] bg-white/[0.08] p-3.5 ring-1 ring-white/12 backdrop-blur-xl">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <span
                className={cn(
                  "size-3 rounded-full",
                  isAvailable ? "bg-[#74e0a3]" : "bg-white/35",
                )}
              />
              {isAvailable ? (
                <span className="absolute size-3 animate-ping rounded-full bg-[#74e0a3]/70" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">
                {isAvailable ? "آماده دریافت درخواست" : "خارج از دسترس"}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-white/60">
                {!isAvailable
                  ? "کشاورزان فعلاً شما را در جستجو نمی‌بینند"
                  : isSearchable
                    ? "در جستجوی کشاورزان نمایش داده می‌شوید"
                    : "برای نمایش در جستجو، موارد ناقص را کامل کنید"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              aria-label="وضعیت آماده به کار"
              disabled={loading || togglingAvailability}
              onClick={onToggleAvailability}
              className={cn(
                "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-60",
                isAvailable ? "bg-[#52b788]" : "bg-white/20",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 flex size-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300",
                  isAvailable ? "left-1" : "left-7",
                )}
              >
                {togglingAvailability ? (
                  <LoaderCircle className="size-3.5 animate-spin text-[#2d6a4f]" />
                ) : null}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <FieldHills />
    </section>
  );
}
