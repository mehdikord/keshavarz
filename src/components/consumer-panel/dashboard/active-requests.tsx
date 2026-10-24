"use client";

import Link from "next/link";
import { ChevronLeft, ClipboardList, Search } from "lucide-react";

import { ConsumerRequestCard } from "@/components/consumer-panel/consumer-request-card";
import type { AppConsumerRequestSummary } from "@/lib/api/app-requests";

interface ActiveRequestsProps {
  requests: AppConsumerRequestSummary[];
  total: number;
}

export function ActiveRequests({ requests, total }: ActiveRequestsProps) {
  return (
    <section aria-labelledby="active-requests-title">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id="active-requests-title" className="text-[15px] font-black text-[#3b2410]">
          درخواست‌های جاری
        </h2>
        {total > 0 ? (
          <Link href="/users/requests" className="inline-flex items-center gap-0.5 text-xs font-bold text-[#b9531f]">
            همه درخواست‌ها
            <ChevronLeft className="size-4" />
          </Link>
        ) : null}
      </div>

      {requests.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[24px] border-2 border-dashed border-[#ecd9bd] bg-white/60 p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fdebd3] text-[#b9531f]">
            <ClipboardList className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-[#3b2410]">درخواست فعالی ندارید</p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-[#8a6a48]">
              خدمت مورد نیازتان را جستجو کنید و درخواست بفرستید.
            </p>
          </div>
          <Link
            href="/users/search"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#b9531f] text-white"
            aria-label="جستجوی خدمات"
          >
            <Search className="size-5" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {requests.map((request) => (
            <li key={request.requestId}>
              <ConsumerRequestCard request={request} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
