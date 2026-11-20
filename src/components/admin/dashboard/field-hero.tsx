"use client";

import { useMemo, useState } from "react";

import {
  faCompact,
  faNumber,
  formatDayMonth,
  formatPercent,
  formatToman,
  formatWeekday,
  percentChange,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { DashboardOverview, DashboardSeriesPoint } from "@/server/modules/admin/dashboard/dashboard.service";

type Metric = "signups" | "requests" | "revenue";

const METRICS: Array<{ key: Metric; label: string; unit: string }> = [
  { key: "signups", label: "ثبت‌نام", unit: "کاربر جدید" },
  { key: "requests", label: "درخواست خدمت", unit: "درخواست" },
  { key: "revenue", label: "درآمد اشتراک", unit: "تومان" },
];

function formatMetric(metric: Metric, value: number): string {
  return metric === "revenue" ? formatToman(value) : `${faNumber(value)} ${METRICS.find((m) => m.key === metric)!.unit}`;
}

function Delta({ current, previous, suffix }: { current: number; previous: number; suffix: string }) {
  const change = percentChange(current, previous);
  if (change === null) {
    return <span className="text-soil-muted">بدون داده برای مقایسه با {suffix}</span>;
  }
  if (change === 0) {
    return <span className="text-soil-muted">بدون تغییر نسبت به {suffix}</span>;
  }
  const up = change > 0;
  return (
    <span className="text-soil-muted">
      <span className={cn("font-bold", up ? "text-[#9be3b6]" : "text-[#f4a493]")}>
        {up ? "+" : "−"}
        {formatPercent(change)}
      </span>{" "}
      نسبت به {suffix}
    </span>
  );
}

/**
 * The dashboard's one loud element: the last 30 days drawn as rows of stalks
 * on dark soil, today's stalk in wheat gold.
 */
export function FieldHero({ overview }: { overview: DashboardOverview }) {
  const [metric, setMetric] = useState<Metric>("signups");
  const [hovered, setHovered] = useState<number | null>(null);
  const series = overview.series;
  const values = useMemo(() => series.map((point) => point[metric]), [metric, series]);
  const max = Math.max(1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);
  const focusIndex = hovered ?? series.length - 1;
  const focus: DashboardSeriesPoint | undefined = series[focusIndex];

  return (
    <section
      aria-label="فعالیت ۳۰ روز اخیر"
      className="relative overflow-hidden rounded-3xl bg-soil text-soil-foreground shadow-[var(--a-shadow-raise)]"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 left-10 size-72 rounded-full bg-wheat/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="text-[13px] text-soil-muted">۳۰ روز گذشته</p>
            <p className="mt-3 text-[44px] leading-none font-extrabold tracking-tight sm:text-[52px]">
              {metric === "revenue" ? faCompact(total) : faNumber(total)}
            </p>
            <p className="mt-2 text-sm text-soil-foreground/80">
              {metric === "revenue" ? "تومان درآمد از فروش اشتراک" : METRICS.find((m) => m.key === metric)!.unit}
            </p>
            <p className="mt-4 text-[12.5px]">
              {metric === "signups" ? (
                <Delta current={overview.users.newWeek} previous={overview.users.newPrevWeek} suffix="هفته قبل" />
              ) : metric === "requests" ? (
                <Delta current={overview.requests.newMonth} previous={overview.requests.newPrevMonth} suffix="۳۰ روز قبل" />
              ) : (
                <Delta current={overview.revenue.paidMonth} previous={overview.revenue.paidPrevMonth} suffix="۳۰ روز قبل" />
              )}
            </p>
          </div>

          <div
            aria-label="شاخص نمودار"
            className="inline-flex w-fit rounded-xl bg-white/[0.06] p-1"
            role="radiogroup"
          >
            {METRICS.map((option) => (
              <button
                aria-checked={metric === option.key}
                className={cn(
                  "h-8 rounded-lg px-3 text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-wheat/70",
                  metric === option.key ? "bg-soil-foreground text-soil" : "text-soil-foreground/75 hover:text-soil-foreground",
                )}
                key={option.key}
                onClick={() => setMetric(option.key)}
                role="radio"
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-4 flex min-h-11 items-end justify-between gap-4" aria-live="polite">
            {focus ? (
              <div>
                <p className="text-[12px] text-soil-muted">
                  {focusIndex === series.length - 1 ? "امروز" : formatWeekday(`${focus.date}T12:00:00+03:30`)}،{" "}
                  {formatDayMonth(`${focus.date}T12:00:00+03:30`)}
                </p>
                <p className="mt-1 text-lg font-bold">{formatMetric(metric, focus[metric])}</p>
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-[11.5px] text-soil-muted">
              <span className="size-2 rounded-full bg-wheat" />
              امروز
            </div>
          </div>

          <div
            className="relative flex h-44 items-end gap-[3px] sm:h-52 sm:gap-1.5"
            onMouseLeave={() => setHovered(null)}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-soil-foreground/15" />
            {total === 0 ? (
              <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-[13px] text-soil-muted">
                در ۳۰ روز گذشته {metric === "signups" ? "ثبت‌نامی" : metric === "requests" ? "درخواستی" : "پرداختی"} ثبت نشده است.
              </p>
            ) : null}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-1/2 h-px border-t border-dashed border-soil-foreground/[0.07]" />
            {series.map((point, index) => {
              const value = point[metric];
              const height = value === 0 ? 0 : Math.max(6, (value / max) * 100);
              const isToday = index === series.length - 1;
              const isFocus = index === focusIndex;
              return (
                <button
                  aria-label={`${formatDayMonth(`${point.date}T12:00:00+03:30`)}: ${formatMetric(metric, value)}`}
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                  key={`${metric}-${point.date}`}
                  onBlur={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onMouseEnter={() => setHovered(index)}
                  type="button"
                >
                  {value === 0 ? (
                    <span className="mb-[-2px] size-1 rounded-full bg-soil-foreground/25" />
                  ) : (
                    <span
                      className={cn(
                        "admin-stalk w-full max-w-3 rounded-t-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-wheat/70",
                        isToday ? "bg-wheat" : isFocus ? "bg-[#b9e8c9]" : "bg-[#6fbf8f]/70",
                      )}
                      style={{ animationDelay: `${index * 18}ms`, height: `${height}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-soil-muted">
            <span>{formatDayMonth(`${series[0]?.date}T12:00:00+03:30`)}</span>
            <span>{formatDayMonth(`${series.at(-1)?.date}T12:00:00+03:30`)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
