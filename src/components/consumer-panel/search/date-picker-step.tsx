"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";

import { PersianCalendar } from "@/components/shared/persian-calendar";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { formatPersianIsoChip, getPersianParts, persianDateToIso } from "@/lib/utils/jalali";

/** Server-side cap on dates per search. */
export const MAX_SEARCH_DATES = 31;

const QUICK_DAYS = [
  { offset: 0, label: "امروز" },
  { offset: 1, label: "فردا" },
  { offset: 2, label: "پس‌فردا" },
];

/** Same ISO key the calendar produces, so quick picks and calendar picks match. */
function isoForOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const parts = getPersianParts(date);
  return persianDateToIso(parts.year, parts.month, parts.day);
}

interface DatePickerStepProps {
  value: string[];
  onChange: (dates: string[]) => void;
}

export function DatePickerStep({ value, onChange }: DatePickerStepProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const quick = useMemo(() => QUICK_DAYS.map((day) => ({ ...day, iso: isoForOffset(day.offset) })), []);
  const sorted = useMemo(() => [...value].sort(), [value]);

  const toggle = (iso: string) => {
    onChange(value.includes(iso) ? value.filter((item) => item !== iso) : [...value, iso].slice(0, MAX_SEARCH_DATES));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {quick.map((day) => {
          const active = value.includes(day.iso);
          return (
            <button
              key={day.iso}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(day.iso)}
              className={cn(
                "flex flex-col items-center rounded-2xl py-2.5 transition-all",
                active
                  ? "bg-[#b9531f] text-white shadow-[0_10px_20px_-12px_rgba(185,83,31,0.9)]"
                  : "bg-[#fcf7ee] text-[#3b2410] ring-1 ring-[#efe0c8] hover:ring-[#e3b97f]",
              )}
            >
              <span className="text-[13px] font-black">{day.label}</span>
              <span className={cn("text-[10.5px]", active ? "text-white/80" : "text-[#8a6a48]")}>
                {formatPersianIsoChip(day.iso)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setCalendarOpen((open) => !open)}
        aria-expanded={calendarOpen}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[12.5px] font-bold border border-dashed border-[#e3c9a3] text-[#a0561a] transition-colors hover:bg-[#fff8ec]"
      >
        <CalendarDays className="size-4" />
        {calendarOpen ? "بستن تقویم" : "انتخاب روزهای دیگر از تقویم"}
        <ChevronDown className={cn("size-4 transition-transform", calendarOpen && "rotate-180")} />
      </button>

      {calendarOpen ? (
        <div
          className="mt-3 rounded-2xl bg-[#fcf7ee] p-2 ring-1 ring-[#efe0c8]"
          // Re-tint the shared calendar to the consumer palette.
          style={{ "--primary": "#b9531f", "--ring": "#b9531f" } as React.CSSProperties}
        >
          <PersianCalendar selectedDates={value} onChange={(dates) => onChange(dates.slice(0, MAX_SEARCH_DATES))} />
        </div>
      ) : null}

      {/* The open calendar lists its own picks, so only show chips when it is closed. */}
      {sorted.length > 0 && !calendarOpen ? (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-bold text-[#8a6a48]">
            {toPersianDigits(sorted.length)} روز مناسب برای انجام کار
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((iso) => (
              <span
                key={iso}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff1df] py-1 pe-1 ps-3 text-[11.5px] font-bold text-[#8a4512]"
              >
                {formatPersianIsoChip(iso)}
                <button
                  type="button"
                  onClick={() => toggle(iso)}
                  aria-label={`حذف ${formatPersianIsoChip(iso)}`}
                  className="flex size-5 items-center justify-center rounded-full hover:bg-[#fbdcb8]"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
