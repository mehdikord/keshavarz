"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  ADMIN_LIST_LIMITS,
  type AdminCursorMeta,
  type AdminListLimit,
} from "@/lib/admin/search-params";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AdminCursorPaginationProps {
  meta: AdminCursorMeta;
  pageItemCount: number;
  canGoPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onLimitChange: (limit: AdminListLimit) => void;
  className?: string;
}

export function AdminCursorPagination({
  meta,
  pageItemCount,
  canGoPrevious,
  onPrevious,
  onNext,
  onLimitChange,
  className,
}: AdminCursorPaginationProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>در صفحه</span>
          <Select
            value={String(meta.limit)}
            onValueChange={(value) =>
              onLimitChange(Number(value) as AdminListLimit)
            }
          >
            <SelectTrigger size="sm" className="min-w-20 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_LIST_LIMITS.map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span>نتایج این صفحه: {pageItemCount.toLocaleString("fa-IR")}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        >
          <ChevronRight className="size-4" />
          قبلی
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={!meta.hasMore || !meta.nextCursor}
          onClick={onNext}
        >
          بعدی
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
