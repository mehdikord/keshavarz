"use client";

import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type AdminTableDensity = "comfortable" | "compact";

export interface AdminDataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Sticky end column for row actions (RTL: left side). */
  stickyActions?: boolean;
}

interface AdminDataTableProps<T> {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  density?: AdminTableDensity;
  loading?: boolean;
  error?: { message: string; requestId?: string } | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  selectedRowId?: string | null;
  onRowClick?: (row: T) => void;
  visibleColumnIds?: string[];
  skeletonRows?: number;
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  rows,
  getRowId,
  density = "comfortable",
  loading = false,
  error = null,
  emptyTitle = "موردی یافت نشد",
  emptyDescription = "با فیلترهای فعلی نتیجه‌ای وجود ندارد.",
  onRetry,
  selectedRowId,
  onRowClick,
  visibleColumnIds,
  skeletonRows = 6,
  className,
}: AdminDataTableProps<T>) {
  const visibleColumns = visibleColumnIds
    ? columns.filter((column) => visibleColumnIds.includes(column.id))
    : columns;

  const cellPad =
    density === "compact" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center",
          className,
        )}
      >
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">{error.message}</p>
          {error.requestId ? (
            <p className="font-mono text-xs text-muted-foreground">
              requestId: {error.requestId}
            </p>
          ) : null}
        </div>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]",
        className,
      )}
    >
      <Table>
        <TableHeader className="bg-[var(--admin-table-header)]">
          <TableRow className="hover:bg-transparent">
            {visibleColumns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  cellPad,
                  "h-auto font-semibold text-foreground",
                  column.stickyActions &&
                    "sticky left-0 z-10 bg-[var(--admin-table-header)]",
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className={cellPad}>
                      <Skeleton className="h-4 w-full max-w-[9rem]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : null}

          {!loading && rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={Math.max(visibleColumns.length, 1)}
                className="h-40"
              >
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Inbox className="size-8 text-muted-foreground/70" />
                  <p className="font-medium text-foreground">{emptyTitle}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {emptyDescription}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : null}

          {!loading
            ? rows.map((row) => {
                const id = getRowId(row);
                const selected = selectedRowId === id;
                return (
                  <TableRow
                    key={id}
                    data-state={selected ? "selected" : undefined}
                    className={cn(
                      "border-[var(--admin-border)]",
                      onRowClick && "cursor-pointer",
                      selected
                        ? "bg-primary/5"
                        : "hover:bg-[var(--admin-row-hover)]",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          cellPad,
                          column.stickyActions &&
                            "sticky left-0 z-10 bg-[var(--admin-panel)]",
                          column.className,
                        )}
                        onClick={
                          column.stickyActions
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            : null}
        </TableBody>
      </Table>
    </div>
  );
}

interface AdminColumnVisibilityMenuProps {
  columns: { id: string; label: string }[];
  visibleColumnIds: string[];
  onChange: (ids: string[]) => void;
}

export function AdminColumnVisibilityControls({
  columns,
  visibleColumnIds,
  onChange,
}: AdminColumnVisibilityMenuProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {columns.map((column) => {
        const checked = visibleColumnIds.includes(column.id);
        return (
          <label
            key={column.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => {
                if (value === true) {
                  onChange([...visibleColumnIds, column.id]);
                  return;
                }
                if (visibleColumnIds.length <= 1) return;
                onChange(visibleColumnIds.filter((id) => id !== column.id));
              }}
            />
            {column.label}
          </label>
        );
      })}
    </div>
  );
}
