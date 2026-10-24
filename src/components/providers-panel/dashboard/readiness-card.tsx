"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  CreditCard,
  MapPinned,
  Power,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

/** Keys match `eligibility.missing` from the provider API. */
type ReadinessKey = "services" | "workArea" | "subscription" | "availability" | "active";

interface ReadinessItem {
  key: ReadinessKey;
  label: string;
  hint: string;
  icon: typeof Wrench;
  href?: string;
}

const ITEMS: ReadinessItem[] = [
  {
    key: "services",
    label: "ثبت خدمات",
    hint: "حداقل یک خدمت فعال با قیمت ثبت کنید",
    icon: Wrench,
    href: "/providers/services",
  },
  {
    key: "workArea",
    label: "محدوده کاری",
    hint: "مرکز و شعاع فعالیت را روی نقشه مشخص کنید",
    icon: MapPinned,
    href: "/providers/services?tab=area",
  },
  {
    key: "subscription",
    label: "اشتراک فعال",
    hint: "با اشتراک در نتایج جستجو دیده می‌شوید",
    icon: CreditCard,
    href: "/providers/subscription",
  },
  {
    key: "availability",
    label: "آماده به کار",
    hint: "وضعیت دریافت درخواست را روشن کنید",
    icon: Power,
  },
  {
    key: "active",
    label: "تأیید حساب",
    hint: "حساب شما توسط پشتیبانی بررسی می‌شود",
    icon: ShieldCheck,
  },
];

interface ReadinessCardProps {
  missing: string[];
  /** Omitted while the provider profile does not exist yet. */
  onEnableAvailability?: () => void;
  togglingAvailability: boolean;
}

export function ReadinessCard({
  missing,
  onEnableAvailability,
  togglingAvailability,
}: ReadinessCardProps) {
  const missingSet = new Set(missing);
  const done = ITEMS.filter((item) => !missingSet.has(item.key)).length;
  const progress = done / ITEMS.length;
  const circumference = 2 * Math.PI * 22;

  return (
    <section
      aria-labelledby="readiness-title"
      className="overflow-hidden rounded-[28px] bg-surface shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] ring-1 ring-border/60"
    >
      <div className="flex items-center gap-4 bg-[linear-gradient(160deg,#fff6e6_0%,#ffffff_70%)] p-5">
        <div className="relative size-[60px] shrink-0">
          <svg viewBox="0 0 52 52" className="size-full -rotate-90">
            <circle cx="26" cy="26" r="22" fill="none" strokeWidth="5" className="stroke-[#f4a261]/15" />
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-[#e08a2b] transition-[stroke-dashoffset] duration-700"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums text-[#9a5b13]">
            {toPersianDigits(done)}/{toPersianDigits(ITEMS.length)}
          </span>
        </div>
        <div className="min-w-0">
          <h2 id="readiness-title" className="text-[15px] font-black text-foreground">
            آماده‌سازی پروفایل
          </h2>
          <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
            این موارد را کامل کنید تا کشاورزان منطقه شما را در جستجو پیدا کنند.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border/50 px-2 pb-2">
        {ITEMS.map((item) => {
          const isDone = !missingSet.has(item.key);
          const Icon = isDone ? Check : item.icon;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  isDone ? "bg-[#d8f3dc] text-[#2d6a4f]" : "bg-[#fdefd6] text-[#b4661a]",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={isDone ? 2.75 : 2} />
              </span>
              <span className="min-w-0 flex-1 text-right">
                <span
                  className={cn(
                    "block text-[13px] font-bold",
                    isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
                {!isDone ? (
                  <span className="block truncate text-[11px] text-muted-foreground">{item.hint}</span>
                ) : null}
              </span>
            </>
          );

          if (isDone) {
            return (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2.5">
                {content}
              </li>
            );
          }

          if (item.href) {
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  {content}
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ChevronLeft className="size-4" />
                  </span>
                </Link>
              </li>
            );
          }

          if (item.key === "availability" && onEnableAvailability) {
            return (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={togglingAvailability}
                  onClick={onEnableAvailability}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/50 disabled:opacity-60"
                >
                  {content}
                  <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
                    روشن کردن
                  </span>
                </button>
              </li>
            );
          }

          return (
            <li key={item.key} className="flex items-center gap-3 px-3 py-3">
              {content}
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground">
                <BadgeCheck className="size-3" />
                در انتظار
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
