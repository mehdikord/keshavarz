"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Eye, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Input } from "@/components/ui/input";
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
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import {
  PAYMENT_STATUSES,
  fetchAdminPayments,
  type AdminPaymentListItem,
  type AdminPaymentStatus,
} from "@/lib/api/admin-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice } from "@/lib/utils/format";

const STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  initiated: "آغازشده",
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  cancelled: "لغوشده",
  partially_refunded: "بازپرداخت جزئی",
  refunded: "بازپرداخت‌شده",
};

function isPaymentStatus(value: string | null): value is AdminPaymentStatus {
  return PAYMENT_STATUSES.includes(value as AdminPaymentStatus);
}

export function AdminPaymentsListPage() {
  const { can } = useAdminPermissions();
  const canView = can("payments.view");
  const canExport = can("payments.export");
  const router = useRouter();
  const list = useAdminUrlListState();

  const statusParam = list.get("status");
  const status = isPaymentStatus(statusParam) ? statusParam : null;
  const userId = list.get("userId");

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [userDraft, setUserDraft] = useState(userId ?? "");
  const [items, setItems] = useState<AdminPaymentListItem[]>([]);
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

    void fetchAdminPayments({
      cursor: list.cursor,
      limit: list.limit,
      signal: controller.signal,
      status: status ?? undefined,
      userId: userId || undefined,
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
            : "بارگذاری پرداخت‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, list.cursor, list.limit, reloadKey, status, userId]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (status) {
      next.push({
        id: "status",
        label: `وضعیت: ${STATUS_LABELS[status]}`,
        keys: ["status"],
      });
    }
    if (userId) {
      next.push({
        id: "user",
        label: `کاربر: ${userId}`,
        keys: ["userId"],
      });
    }
    return next;
  }, [status, userId]);

  const columns: AdminDataTableColumn<AdminPaymentListItem>[] = [
    {
      id: "paymentId",
      header: "شناسه",
      cell: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.paymentId}
        </span>
      ),
    },
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
      id: "user",
      header: "کاربر",
      cell: (row) => (
        <Button asChild variant="link" className="h-auto p-0 font-mono text-xs">
          <Link href={`/admins/users/${row.userId}`} dir="ltr">
            {row.userId}
          </Link>
        </Button>
      ),
    },
    {
      id: "gateway",
      header: "درگاه",
      cell: (row) => <span className="text-xs">{row.gateway}</span>,
    },
    {
      id: "paidAt",
      header: "پرداخت",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.paidAt ?? row.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      stickyActions: true,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => void copyPublicId(row.paymentId, "شناسه پرداخت")}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/admins/payments/${row.paymentId}`}>
              <Eye className="size-3.5" />
              جزئیات
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="پرداخت‌ها"
        description="فهرست پرداخت‌ها با فیلتر وضعیت و کاربر."
        actions={
          canExport ? (
            <Button asChild variant="outline" size="sm">
                <Link href="/admins/exports?domain=payments">
                <Download className="size-4" />
                خروجی (فاز ۰۹)
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-lg"
          onClick={() => {
            setStatusDraft(status ?? "all");
            setUserDraft(userId ?? "");
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
        onRemove={(chip) => {
          setLoading(true);
          if (chip.keys?.[0] === "status") {
            list.setFilters({ status: null });
          } else if (chip.keys?.[0] === "userId") {
            list.setFilters({ userId: null });
          }
        }}
        onClearAll={() => {
          setLoading(true);
          list.clearAll();
        }}
      />

      <AdminDataTable
        columns={columns}
        rows={items}
        getRowId={(row) => row.paymentId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        onRowClick={(row) => router.push(`/admins/payments/${row.paymentId}`)}
        emptyTitle="پرداختی یافت نشد"
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
        onReset={() => {
          setStatusDraft("all");
          setUserDraft("");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            status: statusDraft === "all" ? null : statusDraft,
            userId: userDraft.trim() || null,
          });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select value={statusDraft} onValueChange={setStatusDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {PAYMENT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-filter">شناسه کاربر</Label>
            <Input
              id="user-filter"
              value={userDraft}
              onChange={(event) => setUserDraft(event.target.value)}
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>
        </div>
      </AdminFilterDrawer>
    </div>
  );
}
