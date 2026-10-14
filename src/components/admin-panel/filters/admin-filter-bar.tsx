"use client";

import { Filter, RotateCcw, Search, X } from "lucide-react";

import type { AdminFilterChip } from "@/lib/admin/search-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onOpenFilters?: () => void;
  onReset?: () => void;
  filtersActiveCount?: number;
  trailing?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "جستجو...",
  onOpenFilters,
  onReset,
  filtersActiveCount = 0,
  trailing,
  className,
}: AdminFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 rounded-lg pr-9"
          aria-label="جستجوی سریع"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onOpenFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg"
            onClick={onOpenFilters}
          >
            <Filter className="size-4" />
            فیلتر پیشرفته
            {filtersActiveCount > 0 ? (
              <span className="mr-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                {filtersActiveCount}
              </span>
            ) : null}
          </Button>
        ) : null}

        {onReset && filtersActiveCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 rounded-lg"
            onClick={onReset}
          >
            <RotateCcw className="size-4" />
            پاک‌سازی
          </Button>
        ) : null}

        {trailing}
      </div>
    </div>
  );
}

interface AdminFilterChipsProps {
  chips: AdminFilterChip[];
  onRemove?: (chip: AdminFilterChip) => void;
  onClearAll?: () => void;
  className?: string;
}

export function AdminFilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
}: AdminFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-2.5 py-1 text-xs text-foreground"
        >
          {chip.label}
          {onRemove && chip.keys?.length ? (
            <button
              type="button"
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onRemove(chip)}
              aria-label={`حذف فیلتر ${chip.label}`}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      {onClearAll ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onClearAll}
        >
          حذف همه
        </Button>
      ) : null}
    </div>
  );
}
