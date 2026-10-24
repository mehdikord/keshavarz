"use client";

import Link from "next/link";
import { Crown } from "lucide-react";

import type { AppActiveSubscription } from "@/lib/api/app-subscriptions";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const RENEW_SOON_DAYS = 7;

export function SubscriptionCard({ subscription }: { subscription: AppActiveSubscription }) {
  const remainingDays = Math.max(0, Math.ceil(subscription.remainingSeconds / 86_400));
  const totalSeconds =
    subscription.startsAt && subscription.endsAt
      ? (new Date(subscription.endsAt).getTime() - new Date(subscription.startsAt).getTime()) / 1000
      : 0;
  const progress = totalSeconds > 0 ? Math.min(1, subscription.remainingSeconds / totalSeconds) : 1;
  const renewSoon = remainingDays <= RENEW_SOON_DAYS;

  return (
    <Link
      href="/providers/subscription"
      className="relative block overflow-hidden rounded-[26px] bg-[linear-gradient(140deg,#1b4332_0%,#2d6a4f_100%)] p-4 text-white shadow-[0_18px_36px_-20px_rgba(27,67,50,0.8)] transition-transform active:scale-[0.98]"
    >
      <div aria-hidden className="pointer-events-none absolute -left-10 -top-12 size-40 rounded-full bg-[#ffd27f]/20 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe08a] to-[#f4a261] text-[#5c3a10] shadow-lg shadow-black/20">
          <Crown className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white/60">اشتراک فعال</p>
          <p className="truncate text-sm font-black">{subscription.planName}</p>
        </div>
        <div className="shrink-0 text-left">
          <p className="text-xl font-black leading-none tabular-nums">{toPersianDigits(remainingDays)}</p>
          <p className="mt-1 text-[10px] text-white/60">روز باقی‌مانده</p>
        </div>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/15">
        <div
          className={cn(
            "absolute inset-y-0 right-0 rounded-full",
            renewSoon ? "bg-gradient-to-l from-[#ffd27f] to-[#e8892c]" : "bg-gradient-to-l from-[#b7e4c7] to-[#74e0a3]",
          )}
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
      {renewSoon ? (
        <p className="relative mt-2.5 text-[11px] font-bold text-[#ffd27f]">
          اشتراک رو به پایان است؛ برای تمدید ضربه بزنید
        </p>
      ) : null}
    </Link>
  );
}
