"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronLeft, Clock3, MapPin, Navigation, Sprout, X } from "lucide-react";

import type { AppProviderRequestSummary } from "@/lib/api/app-requests";
import type { ProviderRequestState, ProviderRequestTone } from "@/lib/requests/provider-tabs";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatDistance } from "@/lib/utils/format";

const FRESH_MS = 60 * 60 * 1000;

export const TONE_PILL: Record<ProviderRequestTone, string> = {
  new: "bg-[#fdefd6] text-[#9a5b13]",
  active: "bg-[#e3f4ff] text-sky-800",
  done: "bg-[#d8f3dc] text-[#1b5e3b]",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-[#fde2dc] text-[#b23a1f]",
};

const TONE_ICON: Record<ProviderRequestTone, string> = {
  new: "bg-gradient-to-br from-[#ffd9a8] to-[#f4a261] text-[#5c3a10]",
  active: "bg-gradient-to-br from-[#d6efff] to-[#a9dcff] text-sky-800",
  done: "bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7] text-[#2d6a4f]",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-[#fde2dc] text-[#b23a1f]",
};

interface RequestCardProps {
  request: AppProviderRequestSummary;
  state: ProviderRequestState;
  busy?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function RequestCard({ request, state, busy = false, onAccept, onReject }: RequestCardProps) {
  const archived = state.tab === "archive";
  const isNew = state.tab === "new";
  const [renderedAt] = useState(() => Date.now());
  const fresh = isNew && renderedAt - new Date(request.sentAt).getTime() < FRESH_MS;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] ring-1 transition-shadow",
        archived
          ? "bg-surface/70 ring-border/50"
          : "bg-surface shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-border/60 hover:ring-primary/25",
        isNew && "ring-[#f4a261]/40",
      )}
    >
      {isNew ? (
        <span aria-hidden className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-[#f9b46b] to-[#e8892c]" />
      ) : null}

      <div className="flex items-start gap-3 p-4">
        <span className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-2xl", TONE_ICON[state.tone])}>
          <Sprout className="size-6" strokeWidth={1.75} />
          {fresh ? (
            <span className="absolute -left-1 -top-1 flex size-3.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#e8892c]/70" />
              <span className="relative size-3.5 rounded-full bg-[#e8892c] ring-2 ring-surface" />
            </span>
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("truncate rounded-full px-2 py-0.5 text-[10.5px] font-bold", TONE_PILL[state.tone])}>
              {fresh ? "تازه رسیده" : state.label}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground">
              <Clock3 className="size-3" />
              {formatRelativeTime(request.sentAt)}
            </span>
          </div>

          <Link
            href={`/providers/requests/${request.requestId}`}
            className="mt-1.5 block outline-none after:absolute after:inset-0 after:rounded-[24px] focus-visible:after:ring-2 focus-visible:after:ring-primary/40"
          >
            <h3 className={cn("truncate text-[15px] font-black", archived ? "text-foreground/70" : "text-foreground")}>
              {request.serviceName}
            </h3>
          </Link>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{request.landTitle}</span>
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {request.distanceKm > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-[10.5px] font-bold text-foreground/75">
                <Navigation className="size-3" />
                {formatDistance(request.distanceKm)}
              </span>
            ) : null}
            {request.priceToman > 0 ? (
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10.5px] font-black",
                  archived ? "bg-muted text-muted-foreground" : "bg-[#d8f3dc] text-[#1b5e3b]",
                )}
              >
                {new Intl.NumberFormat("fa-IR").format(request.priceToman)} تومان
              </span>
            ) : null}
          </div>
        </div>

        {!isNew ? <ChevronLeft className="mt-8 size-5 shrink-0 text-muted-foreground" /> : null}
      </div>

      {isNew && onAccept && onReject ? (
        <div className="relative z-10 grid grid-cols-[1fr_auto] gap-2 border-t border-border/50 bg-gradient-to-l from-[#fff8ec] to-transparent px-4 py-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary text-[13px] font-black text-primary-foreground shadow-[0_10px_20px_-12px_rgba(45,106,79,0.9)] transition active:scale-[0.98] disabled:opacity-60"
          >
            <Check className="size-4" strokeWidth={2.75} />
            قبول درخواست
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-surface px-4 text-[12.5px] font-bold text-destructive ring-1 ring-destructive/25 transition hover:bg-destructive/5 disabled:opacity-60"
          >
            <X className="size-4" />
            رد
          </button>
        </div>
      ) : null}
    </article>
  );
}
