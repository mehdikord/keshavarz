"use client";

import Link from "next/link";
import { ChevronLeft, Clock3, Inbox, MapPin, Navigation, Sprout } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { AppProviderRequestSummary } from "@/lib/api/app-requests";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatDistance } from "@/lib/utils/format";

interface IncomingRequestsProps {
  loading: boolean;
  requests: AppProviderRequestSummary[];
}

export function IncomingRequests({ loading, requests }: IncomingRequestsProps) {
  return (
    <section aria-labelledby="incoming-title">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id="incoming-title" className="text-[15px] font-black text-foreground">
          درخواست‌های تازه
        </h2>
        <Link
          href="/providers/requests"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-primary"
        >
          همه درخواست‌ها
          <ChevronLeft className="size-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-[92px] rounded-[24px]" />
          <Skeleton className="h-[92px] rounded-[24px]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[24px] border-2 border-dashed border-border bg-surface/60 px-6 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="size-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-bold text-foreground">صندوق درخواست خالی است</p>
          <p className="text-[11.5px] leading-5 text-muted-foreground">
            درخواست کشاورزان نزدیک شما به‌محض ثبت، همین‌جا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {requests.map((request) => (
            <li key={request.requestId}>
              <Link
                href={`/providers/requests/${request.requestId}`}
                className="group flex items-center gap-3 rounded-[24px] bg-surface p-3.5 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60 transition-all active:scale-[0.98] hover:ring-primary/25"
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7] text-[#2d6a4f]">
                  <Sprout className="size-6" strokeWidth={1.75} />
                  <span className="absolute -left-0.5 -top-0.5 size-3 rounded-full bg-[#e8892c] ring-2 ring-surface" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13.5px] font-black text-foreground">
                      {request.serviceName}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground">
                      <Clock3 className="size-3" />
                      {formatRelativeTime(request.sentAt)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11.5px] text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{request.landTitle}</span>
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-[10.5px] font-bold text-foreground/75">
                      <Navigation className="size-3" />
                      {formatDistance(request.distanceKm)}
                    </span>
                    <span className="rounded-lg bg-[#d8f3dc] px-2 py-0.5 text-[10.5px] font-black text-[#1b5e3b]">
                      {new Intl.NumberFormat("fa-IR").format(request.priceToman)} تومان
                    </span>
                  </div>
                </div>
                <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
