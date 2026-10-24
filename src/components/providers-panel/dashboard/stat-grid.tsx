"use client";

import Link from "next/link";
import { ArrowLeft, Inbox, Tractor, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface StatGridProps {
  loading: boolean;
  newRequests: number;
  inProgress: number;
  activeServices: number;
}

export function StatGrid({
  loading,
  newRequests,
  inProgress,
  activeServices,
}: StatGridProps) {
  const hasNew = newRequests > 0;

  return (
    <section aria-label="خلاصه وضعیت" className="grid grid-cols-2 gap-3">
      <Link
        href="/providers/requests"
        className={cn(
          "group relative col-span-2 flex items-center gap-4 overflow-hidden rounded-[26px] p-4 transition-transform active:scale-[0.98]",
          hasNew
            ? "bg-[linear-gradient(135deg,#f9b46b_0%,#e8892c_100%)] text-[#3a2208] shadow-[0_18px_36px_-18px_rgba(224,138,43,0.8)]"
            : "bg-surface text-foreground shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60",
        )}
      >
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-6 size-36 rounded-full bg-white/20 blur-2xl" />
        <span
          className={cn(
            "relative flex size-14 shrink-0 items-center justify-center rounded-2xl",
            hasNew ? "bg-white/30 text-[#3a2208]" : "bg-[#fdefd6] text-[#b4661a]",
          )}
        >
          <Inbox className="size-7" strokeWidth={1.75} />
          {hasNew ? (
            <span className="absolute -left-1 -top-1 flex size-3.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-white" />
              <span className="relative size-3.5 rounded-full bg-white ring-2 ring-[#e8892c]" />
            </span>
          ) : null}
        </span>
        <div className="relative min-w-0 flex-1">
          <p className={cn("text-[12px] font-bold", hasNew ? "text-[#5c3a10]" : "text-muted-foreground")}>
            درخواست‌های جدید
          </p>
          <p className="mt-0.5 text-[32px] font-black leading-none tabular-nums">
            {loading ? "…" : toPersianDigits(newRequests)}
          </p>
          <p className={cn("mt-1 text-[11px]", hasNew ? "text-[#5c3a10]/80" : "text-muted-foreground")}>
            {hasNew ? "منتظر پاسخ شما هستند" : "فعلاً درخواست تازه‌ای نیست"}
          </p>
        </div>
        <span
          className={cn(
            "relative flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-x-1",
            hasNew ? "bg-[#3a2208] text-white" : "bg-primary/10 text-primary",
          )}
        >
          <ArrowLeft className="size-5" strokeWidth={2.25} />
        </span>
      </Link>

      <MiniStat
        href="/providers/requests"
        icon={Tractor}
        label="در حال انجام"
        value={inProgress}
        loading={loading}
        tone="bg-[#d8f3dc] text-[#2d6a4f]"
      />
      <MiniStat
        href="/providers/services"
        icon={Wrench}
        label="خدمات فعال"
        value={activeServices}
        loading={loading}
        tone="bg-[#e3f4ff] text-sky-700"
      />
    </section>
  );
}

function MiniStat({
  href,
  icon: Icon,
  label,
  value,
  loading,
  tone,
}: {
  href: string;
  icon: typeof Inbox;
  label: string;
  value: number;
  loading: boolean;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[24px] bg-surface p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60 transition-all active:scale-[0.97] hover:ring-primary/25"
    >
      <span className="flex items-start justify-between gap-2">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
        <span className="text-[28px] font-black leading-none tabular-nums text-foreground">
          {loading ? "…" : toPersianDigits(value)}
        </span>
      </span>
      <span className="mt-3 block text-[12px] font-bold text-muted-foreground">{label}</span>
    </Link>
  );
}
