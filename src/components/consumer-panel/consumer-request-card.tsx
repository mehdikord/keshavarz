"use client";

import Link from "next/link";
import { BadgeCheck, MapPin, Tractor, XCircle } from "lucide-react";

import type { AppConsumerRequestSummary } from "@/lib/api/app-requests";
import { CONSUMER_TONE_PILL, consumerRequestState } from "@/lib/requests/consumer-status";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";

const STEPS = ["ثبت", "پذیرش", "انجام"];
const FULL = new Intl.NumberFormat("fa-IR");

interface ConsumerRequestCardProps {
  request: AppConsumerRequestSummary;
  href?: string;
  /** Extra actions rendered under the card body (kept outside the card link). */
  footer?: React.ReactNode;
}

export function ConsumerRequestCard({ request, href, footer }: ConsumerRequestCardProps) {
  const state = consumerRequestState(request.status);
  const target =
    href ?? `/users/requests/${request.requestId}${request.searchId ? `?searchId=${request.searchId}` : ""}`;
  const muted = state.tone === "cancelled";
  const Icon = state.tone === "done" ? BadgeCheck : state.tone === "cancelled" ? XCircle : Tractor;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] ring-1 transition-all",
        muted
          ? "bg-white/70 ring-[#efe0c8]"
          : "bg-white shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-[#efe0c8] hover:ring-[#e3b97f]",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              state.tone === "active" || state.tone === "done"
                ? "bg-gradient-to-br from-[#e1f0dc] to-[#bfe0b4] text-[#2f6a35]"
                : state.tone === "cancelled"
                  ? "bg-[#f6ece0] text-[#a08463]"
                  : "bg-gradient-to-br from-[#ffe7c2] to-[#f8c372] text-[#8a4512]",
            )}
          >
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              {/* The stretched link makes the whole card tappable without nesting the footer actions. */}
              <Link
                href={target}
                className="truncate text-[14px] font-black text-[#3b2410] outline-none after:absolute after:inset-0 after:rounded-[24px] focus-visible:after:ring-2 focus-visible:after:ring-[#b9531f]"
              >
                {request.serviceName}
              </Link>
              <span className="shrink-0 text-[10.5px] text-[#9a7b58]">{formatRelativeTime(request.createdAt)}</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-[#8a6a48]">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{request.landTitle}</span>
            </p>
          </div>
        </div>

        {!muted ? (
          <div className="mt-3.5 flex items-center gap-1.5" aria-label={`مرحله ${state.step} از ۳`}>
            {STEPS.map((step, index) => (
              <div key={step} className="flex-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full",
                    index < state.step
                      ? state.tone === "waiting"
                        ? "bg-[#e08a2b]"
                        : "bg-[#4f9a55]"
                      : "bg-[#f1e6d6]",
                  )}
                />
                <p className={cn("mt-1 text-[10px] font-bold", index < state.step ? "text-[#5c4120]" : "text-[#b8a189]")}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className={cn("truncate rounded-full px-2.5 py-1 text-[10.5px] font-black", CONSUMER_TONE_PILL[state.tone])}>
            {state.label}
          </span>
          {request.agreedPriceToman ? (
            <span className="shrink-0 text-[12px] font-black tabular-nums text-[#5c4120]">
              {FULL.format(request.agreedPriceToman)}
              <span className="ms-1 text-[10px] font-bold text-[#a08463]">تومان</span>
            </span>
          ) : request.assignedProviderName ? (
            <span className="truncate text-[11px] font-bold text-[#6b4a26]">{request.assignedProviderName}</span>
          ) : null}
        </div>
        {request.agreedPriceToman && request.assignedProviderName ? (
          <p className="mt-1.5 truncate text-[11px] font-bold text-[#6b4a26]">{request.assignedProviderName}</p>
        ) : null}
      </div>

      {footer ? <div className="relative z-10 border-t border-[#f1e6d6] px-4 py-3">{footer}</div> : null}
    </article>
  );
}
