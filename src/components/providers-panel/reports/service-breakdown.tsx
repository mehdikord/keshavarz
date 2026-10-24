"use client";

import { Sprout } from "lucide-react";

import { toPersianDigits } from "@/lib/utils/format";

export interface ServiceRevenueRow {
  serviceId: string;
  name: string;
  totalToman: number;
  completedCount: number;
}

const FULL = new Intl.NumberFormat("fa-IR");

export function ServiceBreakdown({ rows, loading }: { rows: ServiceRevenueRow[]; loading: boolean }) {
  const earning = rows.filter((row) => row.totalToman > 0).sort((a, b) => b.totalToman - a.totalToman);
  const total = earning.reduce((sum, row) => sum + row.totalToman, 0);
  const max = earning[0]?.totalToman ?? 0;

  return (
    <section
      aria-labelledby="service-breakdown-title"
      className="rounded-[26px] bg-surface p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60"
    >
      <h2 id="service-breakdown-title" className="text-[14px] font-black text-foreground">
        سهم هر خدمت از درآمد
      </h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground">در بازه انتخاب‌شده</p>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : earning.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-5 text-center text-[12px] text-muted-foreground">
          در این بازه درآمدی از خدمات ثبت نشده است.
        </p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {earning.map((row) => {
            const share = total > 0 ? Math.round((row.totalToman / total) * 100) : 0;
            return (
              <li key={row.serviceId}>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d8f3dc] text-[#2d6a4f]">
                    <Sprout className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12.5px] font-bold text-foreground">{row.name}</p>
                      <p className="shrink-0 text-[12px] font-black tabular-nums text-foreground">
                        {toPersianDigits(share)}٪
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${max > 0 ? Math.max(3, (row.totalToman / max) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                      {FULL.format(row.totalToman)} تومان، {toPersianDigits(row.completedCount)} کار
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
