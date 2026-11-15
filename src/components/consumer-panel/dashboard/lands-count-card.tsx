import Link from "next/link";
import { ChevronLeft, LandPlot } from "lucide-react";

import { toPersianDigits } from "@/lib/utils/format";

export function LandsCountCard({ count, hasMore = false }: { count: number; hasMore?: boolean }) {
  const value = `${toPersianDigits(count)}${hasMore ? "+" : ""}`;

  return (
    <Link
      href="/users/lands"
      aria-label={`زمین‌های شما: ${value} زمین`}
      className="group flex items-center gap-3 rounded-[22px] bg-white p-3 pe-4 ring-1 ring-[#efe0c8] transition hover:ring-[#e3b97f] active:scale-[0.98]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fdebd3] text-[#a0561a]">
        <LandPlot className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-bold text-[#8a6a48]">زمین‌های شما</span>
      <span className="text-[22px] font-black tabular-nums text-[#3b2410]">{value}</span>
      <ChevronLeft className="size-5 shrink-0 text-[#b9531f] transition-transform group-hover:-translate-x-0.5" />
    </Link>
  );
}
