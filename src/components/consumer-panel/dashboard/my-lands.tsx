"use client";

import Link from "next/link";
import { ChevronLeft, LandPlot, Plus } from "lucide-react";

import type { AppLand } from "@/lib/api/app-lands";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";

export function MyLands({ lands }: { lands: AppLand[] }) {
  return (
    <section aria-labelledby="my-lands-title">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id="my-lands-title" className="text-[15px] font-black text-[#3b2410]">
          زمین‌های من
          <span className="ms-1.5 text-[12px] font-bold text-[#a08463]">({toPersianDigits(lands.length)})</span>
        </h2>
        <Link href="/users/lands" className="inline-flex items-center gap-0.5 text-xs font-bold text-[#b9531f]">
          مدیریت
          <ChevronLeft className="size-4" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {lands.map((land) => {
          const area = formatAreaSqm(Number(land.areaSquareMeters));
          return (
            <Link
              key={land.landId}
              href={`/users/lands/${land.landId}/edit`}
              className="flex max-w-56 shrink-0 snap-start items-center gap-2.5 rounded-2xl bg-white py-2.5 pe-4 ps-2.5 ring-1 ring-[#efe0c8] transition-colors hover:ring-[#e3b97f]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fdebd3] text-[#a0561a]">
                <LandPlot className="size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-black text-[#3b2410]">{land.title}</span>
                <span className="block text-[11px] text-[#8a6a48]">
                  {area.primary} {area.primaryUnit}
                </span>
              </span>
            </Link>
          );
        })}

        <Link
          href="/users/lands/new"
          aria-label="افزودن زمین"
          className="flex shrink-0 snap-start items-center gap-1.5 rounded-2xl border border-dashed border-[#e3c9a3] px-4 text-[12px] font-bold text-[#b9531f] transition-colors hover:bg-white"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          افزودن
        </Link>
      </div>
    </section>
  );
}
