"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CircleX, Clock3, Crown, Receipt } from "lucide-react";

import type { AppPaymentSummary } from "@/lib/api/app-payments";
import type { AppSubscriptionHistoryItem } from "@/lib/api/app-subscriptions";
import {
  STATUS_TONE_CLASS,
  isPaymentPending,
  paymentStatusInfo,
  subscriptionStatusInfo,
} from "@/lib/subscriptions/labels";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

type View = "payments" | "subscriptions";

interface BillingHistoryProps {
  payments: AppPaymentSummary[];
  subscriptions: AppSubscriptionHistoryItem[];
}

export function BillingHistory({ payments, subscriptions }: BillingHistoryProps) {
  const [view, setView] = useState<View>("payments");

  if (payments.length === 0 && subscriptions.length === 0) return null;

  return (
    <section aria-labelledby="billing-title">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 id="billing-title" className="text-[15px] font-black text-foreground">
          سوابق
        </h2>
        <div role="tablist" className="flex gap-1 rounded-full bg-muted/70 p-1">
          {(
            [
              { key: "payments", label: "پرداخت‌ها" },
              { key: "subscriptions", label: "اشتراک‌ها" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={view === item.key}
              onClick={() => setView(item.key)}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-colors",
                view === item.key ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {view === item.key ? (
                <motion.span
                  layoutId="billing-tab"
                  className="absolute inset-0 rounded-full bg-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="overflow-hidden rounded-[24px] bg-surface shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60">
        {view === "payments" ? (
          payments.length === 0 ? (
            <EmptyRow text="پرداختی ثبت نشده است" />
          ) : (
            payments.map((payment, index) => {
              const info = paymentStatusInfo(payment.status);
              const pending = isPaymentPending(payment.status);
              const Icon = payment.status === "paid" ? CheckCircle2 : payment.status === "failed" ? CircleX : Clock3;
              return (
                <li key={payment.paymentId} className={cn("flex items-center gap-3 px-4 py-3.5", index > 0 && "border-t border-border/50")}>
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", STATUS_TONE_CLASS[info.tone])}>
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black tabular-nums text-foreground">
                      {new Intl.NumberFormat("fa-IR").format(payment.amountToman)}
                      <span className="ms-1 text-[10.5px] font-bold text-muted-foreground">تومان</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {DATE.format(new Date(payment.paidAt ?? payment.createdAt))}
                    </p>
                  </div>
                  {pending ? (
                    <Link
                      href={`/providers/subscription/return?paymentId=${encodeURIComponent(payment.paymentId)}`}
                      className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                    >
                      بررسی وضعیت
                    </Link>
                  ) : (
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-black", STATUS_TONE_CLASS[info.tone])}>
                      {info.label}
                    </span>
                  )}
                </li>
              );
            })
          )
        ) : subscriptions.length === 0 ? (
          <EmptyRow text="اشتراکی ثبت نشده است" />
        ) : (
          subscriptions.map((record, index) => {
            const info = subscriptionStatusInfo(record.status);
            return (
              <li key={record.subscriptionId} className={cn("flex items-center gap-3 px-4 py-3.5", index > 0 && "border-t border-border/50")}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fdefd6] text-[#b4661a]">
                  <Crown className="size-5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-foreground">{record.planName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {record.startsAt && record.endsAt
                      ? `${DATE.format(new Date(record.startsAt))} تا ${DATE.format(new Date(record.endsAt))}`
                      : DATE.format(new Date(record.createdAt))}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-black", STATUS_TONE_CLASS[info.tone])}>
                  {info.label}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <li className="flex items-center justify-center gap-2 px-4 py-8 text-[12px] text-muted-foreground">
      <Receipt className="size-4" />
      {text}
    </li>
  );
}
