"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

export interface MonthRow {
  year: number;
  month: number;
  totalToman: number;
  count: number;
}

type ChartTone = "forest" | "harvest";

const TONES: Record<ChartTone, { card: string; active: string; idle: string; activeLabel: string }> = {
  forest: {
    card: "bg-surface shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-border/60",
    active: "bg-primary",
    idle: "bg-[#b7e4c7] group-hover:bg-[#95d5b2]",
    activeLabel: "text-primary",
  },
  harvest: {
    card: "bg-white shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-[#efe0c8]",
    active: "bg-[#b9531f]",
    idle: "bg-[#f6d3a6] group-hover:bg-[#efbd80]",
    activeLabel: "text-[#b9531f]",
  },
};

interface MonthlyBarChartProps {
  months: MonthRow[];
  title: string;
  /** e.g. "کار انجام‌شده" — shown after the selected month's count. */
  countLabel: string;
  tone?: ChartTone;
}

const COMPACT = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const FULL = new Intl.NumberFormat("fa-IR");

/**
 * Buckets come from the API as Gregorian months; each is named after the
 * Jalali month that covers most of it (its 15th day).
 */
function bucketDate(row: MonthRow) {
  return new Date(row.year, row.month - 1, 15);
}

const MONTH = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });
const MONTH_YEAR = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" });

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function MonthlyBarChart({ months, title, countLabel, tone = "forest" }: MonthlyBarChartProps) {
  const theme = TONES[tone];
  const [selected, setSelected] = useState(months.length - 1);
  const max = niceMax(Math.max(...months.map((row) => row.totalToman), 0));
  const active = months[selected] ?? months.at(-1);
  const gridValues = [max, max / 2, 0];

  if (!active) return null;

  return (
    <section
      aria-labelledby="revenue-chart-title"
      className={cn("rounded-[26px] p-4 ring-1", theme.card)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="revenue-chart-title" className="text-[14px] font-black text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">روی هر ستون بزنید تا جزئیاتش را ببینید</p>
        </div>
        <div className="shrink-0 text-left" aria-live="polite">
          <p className="text-[11px] font-bold text-muted-foreground">{MONTH_YEAR.format(bucketDate(active))}</p>
          <p className="mt-0.5 text-[18px] font-black leading-tight tabular-nums text-foreground">
            {FULL.format(active.totalToman)}
            <span className="ms-1 text-[10.5px] font-bold text-muted-foreground">تومان</span>
          </p>
          <p className="text-[10.5px] text-muted-foreground">{toPersianDigits(active.count)} {countLabel}</p>
        </div>
      </div>

      <div className="relative mt-5 h-44">
        {gridValues.map((value, index) => (
          <div
            key={value}
            aria-hidden
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ top: `${(index / (gridValues.length - 1)) * 100}%` }}
          >
            <span className="w-12 shrink-0 -translate-y-1/2 whitespace-nowrap text-right text-[9.5px] tabular-nums text-muted-foreground">
              {value === 0 ? "۰" : COMPACT.format(value)}
            </span>
            <span className="h-px flex-1 -translate-y-1/2 bg-border/70" />
          </div>
        ))}

        <div className="absolute inset-y-0 left-0 right-14 flex items-end gap-[3px]">
          {months.map((row, index) => {
            const isSelected = index === selected;
            const height = (row.totalToman / max) * 100;
            return (
              <button
                key={`${row.year}-${row.month}`}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={isSelected}
                aria-label={`${MONTH_YEAR.format(bucketDate(row))}: ${FULL.format(row.totalToman)} تومان`}
                className="group relative flex h-full flex-1 items-end justify-center rounded-t-md outline-none focus-visible:bg-primary/5"
              >
                <span
                  className={cn(
                    "w-full max-w-[22px] rounded-t-[4px] transition-all duration-300",
                    isSelected ? theme.active : theme.idle,
                  )}
                  style={{ height: row.totalToman > 0 ? `max(${height}%, 4px)` : "2px" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mr-14 mt-2 flex gap-[3px]" aria-hidden>
        {months.map((row, index) => {
          const showLabel = (months.length - 1 - index) % 2 === 0 || index === selected;
          return (
            <span
              key={`${row.year}-${row.month}-label`}
              className={cn(
                "flex-1 overflow-visible whitespace-nowrap text-center text-[9.5px]",
                index === selected ? cn("font-black", theme.activeLabel) : "text-muted-foreground",
                !showLabel && "invisible",
              )}
            >
              {MONTH.format(bucketDate(row))}
            </span>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>درآمد ماهانه</caption>
        <thead>
          <tr>
            <th scope="col">ماه</th>
            <th scope="col">درآمد (تومان)</th>
            <th scope="col">تعداد کار</th>
          </tr>
        </thead>
        <tbody>
          {months.map((row) => (
            <tr key={`${row.year}-${row.month}-row`}>
              <td>{MONTH_YEAR.format(bucketDate(row))}</td>
              <td>{FULL.format(row.totalToman)}</td>
              <td>{toPersianDigits(row.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
