"use client";

import { CalendarRange, LoaderCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/admin/ui/button";
import { controlClass } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";
import {
  PERIOD_LABELS,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/server/modules/admin/reports/report-period";

const QUICK: PeriodPreset[] = PERIOD_PRESETS.filter((preset) => preset !== "custom");

export function PeriodBar({
  current,
  customFrom,
  customTo,
  error,
  rangeText,
}: {
  current: PeriodPreset;
  /** Jalali `1405-08-01` of the resolved range, to prefill the custom inputs. */
  customFrom: string;
  customTo: string;
  error?: string | null;
  rangeText: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(current === "custom" || Boolean(error));
  const [from, setFrom] = useState(customFrom.replace(/-/g, "/"));
  const [to, setTo] = useState(customTo.replace(/-/g, "/"));

  function go(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div aria-label="بازه گزارش" className="admin-scroll -mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1" role="radiogroup">
          {QUICK.map((preset) => {
            const active = current === preset;
            return (
              <button
                aria-checked={active}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-[10px] px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
                key={preset}
                onClick={() => {
                  setCustomOpen(false);
                  go({ from: null, period: preset === "30d" ? null : preset, to: null });
                }}
                role="radio"
                type="button"
              >
                {PERIOD_LABELS[preset]}
              </button>
            );
          })}
          <button
            aria-expanded={customOpen}
            aria-pressed={current === "custom"}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === "custom" ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
            onClick={() => setCustomOpen(!customOpen)}
            type="button"
          >
            <CalendarRange className="size-4" />
            {PERIOD_LABELS.custom}
          </button>
        </div>
        {pending ? <LoaderCircle aria-label="در حال بارگذاری" className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {customOpen ? (
        <form
          className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            go({ from: from.trim(), period: "custom", to: to.trim() });
          }}
        >
          <label className="grid gap-1 text-[12px] font-semibold text-foreground/85">
            از تاریخ
            <input
              className={cn(controlClass, "w-36 text-left tabular-nums")}
              dir="ltr"
              inputMode="numeric"
              onChange={(event) => setFrom(event.target.value)}
              placeholder="1405/08/01"
              value={from}
            />
          </label>
          <label className="grid gap-1 text-[12px] font-semibold text-foreground/85">
            تا تاریخ
            <input
              className={cn(controlClass, "w-36 text-left tabular-nums")}
              dir="ltr"
              inputMode="numeric"
              onChange={(event) => setTo(event.target.value)}
              placeholder="1405/08/30"
              value={to}
            />
          </label>
          <Button loading={pending} type="submit">
            نمایش گزارش
          </Button>
          <p className="basis-full text-[11.5px] text-muted-foreground">تاریخ شمسی، به شکل ۱۴۰۵/۰۸/۰۱. بازه حداکثر دو سال است.</p>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] text-danger" role="alert">
          {error} گزارش ۳۰ روز اخیر نمایش داده شده است.
        </p>
      ) : null}

      <p className="text-[12.5px] text-muted-foreground">{rangeText}</p>
    </div>
  );
}
