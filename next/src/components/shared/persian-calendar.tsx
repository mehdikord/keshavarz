"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatPersianDayChip,
  getPersianMonthGrid,
  getPersianMonthLabel,
  getPersianParts,
  persianDateToIso,
} from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/format";

interface PersianCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  className?: string;
}

export function PersianCalendar({
  selectedDates,
  onChange,
  className,
}: PersianCalendarProps) {
  const today = getPersianParts(new Date());
  const [viewYear, setViewYear] = React.useState(today.year);
  const [viewMonth, setViewMonth] = React.useState(today.month);

  const { daysInMonth, startWeekday, weekdays } = getPersianMonthGrid(
    viewYear,
    viewMonth,
  );

  const selectedSet = new Set(selectedDates);

  const toggleDay = (day: number) => {
    const iso = persianDateToIso(viewYear, viewMonth, day);
    if (selectedSet.has(iso)) {
      onChange(selectedDates.filter((date) => date !== iso));
      return;
    }
    onChange([...selectedDates, iso].sort());
  };

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((year) => year - 1);
      return;
    }
    setViewMonth((month) => month - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((year) => year + 1);
      return;
    }
    setViewMonth((month) => month + 1);
  };

  const blanks = Array.from({ length: startWeekday }, (_, index) => index);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2">
        <Button type="button" variant="ghost" size="icon" onClick={goNextMonth}>
          <ChevronRight className="size-5" />
        </Button>
        <p className="text-sm font-semibold">
          {getPersianMonthLabel(viewYear, viewMonth)}
        </p>
        <Button type="button" variant="ghost" size="icon" onClick={goPrevMonth}>
          <ChevronLeft className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day) => (
          <div
            key={day}
            className="py-1 text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {blanks.map((blank) => (
          <div key={`blank-${blank}`} />
        ))}
        {days.map((day) => {
          const iso = persianDateToIso(viewYear, viewMonth, day);
          const isSelected = selectedSet.has(iso);
          const isToday =
            today.year === viewYear &&
            today.month === viewMonth &&
            today.day === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl text-sm transition-all",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                  : "hover:bg-muted",
                isToday && !isSelected && "ring-1 ring-primary/40",
              )}
            >
              {toPersianDigits(day)}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedDates.map((iso) => {
            const parts = getPersianParts(new Date(iso));
            return (
              <Badge
                key={iso}
                variant="secondary"
                className="gap-1 rounded-full px-3 py-1"
              >
                {formatPersianDayChip(parts.year, parts.month, parts.day)}
                <button
                  type="button"
                  onClick={() =>
                    onChange(selectedDates.filter((date) => date !== iso))
                  }
                  className="rounded-full p-0.5 hover:bg-black/10"
                  aria-label="حذف تاریخ"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          حداقل یک روز برای انجام کار انتخاب کنید
        </p>
      )}
    </div>
  );
}