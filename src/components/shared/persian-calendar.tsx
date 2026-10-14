"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatPersianIsoChip,
  getPersianMonthGrid,
  getPersianMonthLabel,
  getPersianParts,
  isPersianDatePast,
  persianDateToIso,
} from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/format";

interface PersianCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  className?: string;
}

interface DayCellData {
  day: number;
  iso: string;
  isToday: boolean;
  isPast: boolean;
}

export const PersianCalendar = React.memo(function PersianCalendar({
  selectedDates,
  onChange,
  className,
}: PersianCalendarProps) {
  const today = React.useMemo(() => getPersianParts(new Date()), []);
  const [viewYear, setViewYear] = React.useState(today.year);
  const [viewMonth, setViewMonth] = React.useState(today.month);

  const grid = React.useMemo(
    () => getPersianMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = React.useMemo(
    () => getPersianMonthLabel(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const dayCells = React.useMemo<DayCellData[]>(() => {
    const cells: DayCellData[] = [];
    for (let day = 1; day <= grid.daysInMonth; day += 1) {
      cells.push({
        day,
        iso: persianDateToIso(viewYear, viewMonth, day),
        isToday:
          today.year === viewYear &&
          today.month === viewMonth &&
          today.day === day,
        isPast: isPersianDatePast(viewYear, viewMonth, day),
      });
    }
    return cells;
  }, [grid.daysInMonth, today, viewMonth, viewYear]);

  const selectedSet = React.useMemo(() => new Set(selectedDates), [selectedDates]);

  const toggleDay = React.useCallback(
    (day: number) => {
      const iso = persianDateToIso(viewYear, viewMonth, day);
      if (selectedSet.has(iso)) {
        onChange(selectedDates.filter((date) => date !== iso));
        return;
      }
      onChange([...selectedDates, iso].sort());
    },
    [onChange, selectedSet, selectedDates, viewMonth, viewYear],
  );

  const isViewingCurrentMonth =
    viewYear === today.year && viewMonth === today.month;

  const goPrevMonth = React.useCallback(() => {
    if (isViewingCurrentMonth) return;
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
      return;
    }
    setViewMonth(viewMonth - 1);
  }, [isViewingCurrentMonth, viewMonth, viewYear]);

  const goNextMonth = React.useCallback(() => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
      return;
    }
    setViewMonth(viewMonth + 1);
  }, [viewMonth, viewYear]);

  const blanks = React.useMemo(
    () => Array.from({ length: grid.startWeekday }, (_, index) => index),
    [grid.startWeekday],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goNextMonth}
          aria-label="ماه بعد"
        >
          <ChevronRight className="size-5" />
        </Button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goPrevMonth}
          disabled={isViewingCurrentMonth}
          aria-label="ماه قبل"
        >
          <ChevronLeft className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {grid.weekdays.map((day) => (
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
        {dayCells.map((cell) => {
          const isSelected = selectedSet.has(cell.iso);

          return (
            <button
              key={cell.day}
              type="button"
              onClick={() => toggleDay(cell.day)}
              disabled={cell.isPast}
              aria-disabled={cell.isPast}
              aria-pressed={isSelected}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl text-sm transition-colors",
                isSelected &&
                  "bg-primary font-semibold text-primary-foreground shadow-sm",
                !isSelected && !cell.isPast && "hover:bg-muted",
                cell.isPast && "cursor-not-allowed text-muted-foreground/40",
                cell.isToday && !isSelected && "ring-1 ring-primary/40",
              )}
            >
              {toPersianDigits(cell.day)}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedDates.map((iso) => (
            <Badge
              key={iso}
              variant="secondary"
              className="gap-1 rounded-full px-3 py-1"
            >
              {formatPersianIsoChip(iso)}
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
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          حداقل یک روز برای انجام کار انتخاب کنید
        </p>
      )}
    </div>
  );
});
