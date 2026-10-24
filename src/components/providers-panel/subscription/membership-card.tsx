"use client";

import { CalendarClock, Crown, Sprout } from "lucide-react";

import type { AppActiveSubscription } from "@/lib/api/app-subscriptions";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const RENEW_SOON_DAYS = 7;
const DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Credit-card style summary of the provider's current membership. */
export function MembershipCard({ subscription }: { subscription: AppActiveSubscription | null }) {
  if (!subscription) {
    return (
      <div className="relative mt-5 overflow-hidden rounded-[26px] bg-white/[0.07] p-5 ring-1 ring-white/15 backdrop-blur-xl">
        <div aria-hidden className="absolute -left-10 -top-10 size-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/70">
            <Crown className="size-6" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[15px] font-black">اشتراک فعالی ندارید</p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-white/65">
              فعلاً در جستجوی کشاورزان نمایش داده نمی‌شوید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const remainingDays = Math.max(0, Math.ceil(subscription.remainingSeconds / 86_400));
  const totalSeconds =
    subscription.startsAt && subscription.endsAt
      ? (new Date(subscription.endsAt).getTime() - new Date(subscription.startsAt).getTime()) / 1000
      : 0;
  const progress = totalSeconds > 0 ? Math.min(1, subscription.remainingSeconds / totalSeconds) : 1;
  const renewSoon = remainingDays <= RENEW_SOON_DAYS;

  return (
    <div className="relative mt-5 overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#f6d58e_0%,#e9b54f_38%,#c98a2b_100%)] p-5 text-[#3a2208] shadow-[0_24px_44px_-20px_rgba(201,138,43,0.75)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 -top-16 size-48 rounded-full bg-white/35 blur-2xl" />
        <div className="absolute -bottom-20 -right-10 size-56 rounded-full bg-[#8a5a12]/25 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)]" />
        <Sprout className="absolute -bottom-6 left-4 size-32 rotate-12 text-[#8a5a12]/15" strokeWidth={1.25} />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6b4210]/80">عضویت کشاورز</p>
            <p className="mt-0.5 truncate text-[19px] font-black leading-tight">{subscription.planName}</p>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#3a2208] text-[#f6d58e] shadow-lg shadow-[#3a2208]/30">
            <Crown className="size-5" strokeWidth={2} />
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-1.5">
            <span className="text-[40px] font-black leading-none tabular-nums">{toPersianDigits(remainingDays)}</span>
            <span className="text-[13px] font-bold text-[#6b4210]">روز باقی‌مانده</span>
          </p>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10.5px] font-black",
              renewSoon ? "bg-[#3a2208] text-[#ffd27f]" : "bg-white/45 text-[#3a2208]",
            )}
          >
            {renewSoon ? "نزدیک به پایان" : "فعال"}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#3a2208]/15">
          <div
            className="h-full rounded-full bg-[#3a2208]"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>

        {subscription.endsAt ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-bold text-[#6b4210]">
            <CalendarClock className="size-3.5" />
            اعتبار تا {DATE.format(new Date(subscription.endsAt))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
