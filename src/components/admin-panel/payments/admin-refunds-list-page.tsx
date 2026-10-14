"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";

import {
  AdminCursorPagination,
  AdminDataTable,
  AdminFilterChips,
  AdminFilterDrawer,
  AdminForbidden,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { useAdminUrlListState } from "@/hooks/admin/use-admin-url-list-state";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import {
  REFUND_STATUSES,
  fetchAdminRefunds,
  type AdminRefundListItem,
  type AdminRefundStatus,
} from "@/lib/api/admin-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice } from "@/lib/utils/format";

const STATUS_LABELS: Record<AdminRefundStatus, string> = {
  requested: "درخواست‌شده",
  processing: "در حال پردازش",
  succeeded: "موفق",
  failed: "ناموفق",
  cancelled: "لغوشده",
};

function isRefundStatus(value: string | null): value is AdminRefundStatus {
  return REFUND_STATUSES.includes(value as AdminRefundStatus);
}

export function AdminRefundsListPage() {
  const { can } = useAdminPermissions();
  const canView = can("payments.view");
  const list = useAdminUrlListState();

  const statusParam = list.get("status");
  const status = isRefundStatus(statusParam) ? statusParam : null;

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [items, setItems] = useState<AdminRefundListItem[]>([]);
  const [meta, setMeta] = useState<AdminCursorMeta>({
    hasMore: false,
    limit: list.limit,
    nextCursor: null,
  });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminRefunds({
      cursor: list.cursor,
      limit: list.limit,
      signal: controller.signal,
      status: status ?? undefined,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری بازپرداخت‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, list.cursor, list.limit, reloadKey, status]);

  const chips: AdminFilterChip[] = useMemo(() => {
    if (!status) return [];
    return [
      {
        id: "status",
        label: `وضعیت: ${STATUS_LABELS[status]}`,
        keys: ["status"],
      },
    ];
  }, [status]);

  const columns: AdminDataTableColumn<AdminRefundListItem>[] = [
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      id: "amount",
      header: "مبلغ",
      cell: (row) => (
        <span className="text-xs font-medium">
          {formatPrice(row.amountToman)}
        </span>
      ),
    },
    {
      id: "payment",
      header: "پرداخت",
      cell: (row) => (
        <Button asChild variant="link" className="h-auto p-0 font-mono text-xs">
          <Link href={`/admins/payments/${row.paymentId}`} dir="ltr">
            {row.paymentId}
          </Link>
        </Button>
      ),
    },
    {
      id: "reason",
      header: "دلیل",
      cell: (row) => (
        <span className="line-clamp-2 max-w-xs text-xs">{row.reason}</span>
      ),
    },
    {
      id: "createdAt",
      header: "ایجاد",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      stickyActions: true,
      cell: (row) => (
        <Button asChild size="sm" variant="outline" className="h-8">
          <Link href={`/admins/payments/${row.paymentId}`}>
            <Eye className="size-3.5" />
            پرداخت
          </Link>
        </Button>
      ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="بازپرداخت‌ها"
        description="فهرست refundها با پیوند به پرداخت مربوط."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-lg"
          onClick={() => {
            setStatusDraft(status ?? "all");
            setFilterOpen(true);
          }}
        >
          <Filter className="size-4" />
          فیلتر
          {chips.length > 0 ? (
            <span className="mr-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
              {chips.length}
            </span>
          ) : null}
        </Button>
        {chips.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10"
            onClick={() => {
              setLoading(true);
              list.clearAll();
            }}
          >
            پاک‌سازی
          </Button>
        ) : null}
      </div>

      <AdminFilterChips
        chips={chips}
        onRemove={() => {
          setLoading(true);
          list.setFilters({ status: null });
        }}
        onClearAll={() => {
          setLoading(true);
          list.clearAll();
        }}
      />

      <AdminDataTable
        columns={columns}
        rows={items}
        getRowId={(row) => row.refundId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        emptyTitle="بازپرداختی یافت نشد"
        emptyDescription="فیلتر را تغییر دهید."
      />

      <AdminCursorPagination
        meta={meta}
        pageItemCount={items.length}
        canGoPrevious={Boolean(list.cursor) || list.cursorStack.length > 0}
        onPrevious={() => {
          setLoading(true);
          list.goPrevious();
        }}
        onNext={() => {
          if (!meta.nextCursor) return;
          setLoading(true);
          list.goNext(meta.nextCursor);
        }}
        onLimitChange={(nextLimit) => {
          setLoading(true);
          list.setLimit(nextLimit);
        }}
      />

      <AdminFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onReset={() => setStatusDraft("all")}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            status: statusDraft === "all" ? null : statusDraft,
          });
        }}
      >
        <div className="space-y-2">
          <Label>وضعیت</Label>
          <Select value={statusDraft} onValueChange={setStatusDraft}>
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              {REFUND_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AdminFilterDrawer>
    </div>
  );
}
