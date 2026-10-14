"use client";

import { X } from "lucide-react";

import type { AdminFilterChip } from "@/lib/admin/search-params";
import { cn } from "@/lib/utils";

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
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onRemove(chip)}
              aria-label={`حذف فیلتر ${chip.label}`}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      {onClearAll ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={onClearAll}
        >
          پاک کردن همه
        </button>
      ) : null}
    </div>
  );
}
