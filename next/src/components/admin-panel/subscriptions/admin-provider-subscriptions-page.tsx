"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Filter } from "lucide-react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
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
  SUBSCRIPTION_STATUSES,
  cancelAdminProviderSubscription,
  fetchAdminProviderSubscriptions,
  type AdminProviderSubscription,
  type AdminSubscriptionStatus,
} from "@/lib/api/admin-subscriptions";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice } from "@/lib/utils/format";

const STATUS_LABELS: Record<AdminSubscriptionStatus, string> = {
  pending: "در انتظار",
  active: "فعال",
  expired: "منقضی",
  cancelled: "لغوشده",
};

function isSubscriptionStatus(
  value: string | null,
): value is AdminSubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(value as AdminSubscriptionStatus);
}

export function AdminProviderSubscriptionsPage() {
  const { can } = useAdminPermissions();
  const canView = can("subscriptions.view");
  const canManage = can("subscriptions.manage");
  const list = useAdminUrlListState();

  const statusParam = list.get("status");
  const status = isSubscriptionStatus(statusParam) ? statusParam : null;
  const providerId = list.get("providerId");

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [providerDraft, setProviderDraft] = useState(providerId ?? "");
  const [items, setItems] = useState<AdminProviderSubscription[]>([]);
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
  const [cancelling, setCancelling] =
    useState<AdminProviderSubscription | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminProviderSubscriptions({
      cursor: list.cursor,
      limit: list.limit,
      providerId: providerId || undefined,
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
            : "بارگذاری اشتراک‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, list.cursor, list.limit, providerId, reloadKey, status]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (status) {
      next.push({
        id: "status",
        label: `وضعیت: ${STATUS_LABELS[status]}`,
        keys: ["status"],
      });
    }
    if (providerId) {
      next.push({
        id: "provider",
        label: `Provider: ${providerId}`,
        keys: ["providerId"],
      });
    }
    return next;
  }, [providerId, status]);

  const columns: AdminDataTableColumn<AdminProviderSubscription>[] = [
    {
      id: "plan",
      header: "پلن",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.planName}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.planCode}
          </p>
        </div>
      ),
    },
    {
      id: "provider",
      header: "Provider",
      cell: (row) => (
        <Button asChild variant="link" className="h-auto p-0 font-mono text-xs">
          <Link href={`/admins/providers/${row.providerId}`} dir="ltr">
            {row.providerId}
          </Link>
        </Button>
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
        <span className="text-xs">{formatPrice(row.amountToman)}</span>
      ),
    },
    {
      id: "source",
      header: "منبع",
      cell: (row) => <span className="text-xs">{row.source}</span>,
    },
    {
      id: "endsAt",
      header: "پایان",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.endsAt)}
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
            onClick={() =>
              void copyPublicId(row.subscriptionId, "شناسه اشتراک")
            }
          >
            <Copy className="size-3.5" />
          </Button>
          {canManage &&
          (row.status === "active" || row.status === "pending") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setCancelling(row)}
            >
              لغو
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="اشتراک‌های Provider"
        description="فهرست اشتراک‌ها با فیلتر وضعیت و Provider. اعطای اشتراک از صفحه جزئیات Provider."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-lg"
          onClick={() => {
            setStatusDraft(status ?? "all");
            setProviderDraft(providerId ?? "");
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
          } else if (chip.keys?.[0] === "providerId") {
            list.setFilters({ providerId: null });
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
        getRowId={(row) => row.subscriptionId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        emptyTitle="اشتراکی یافت نشد"
        emptyDescription="فیلتر را تغییر دهید یا از صفحه Provider اعطا کنید."
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
          setProviderDraft("");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            status: statusDraft === "all" ? null : statusDraft,
            providerId: providerDraft.trim() || null,
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
                {SUBSCRIPTION_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-filter">شناسه Provider</Label>
            <Input
              id="provider-filter"
              value={providerDraft}
              onChange={(event) => setProviderDraft(event.target.value)}
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>
        </div>
      </AdminFilterDrawer>

      <AdminConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="لغو اشتراک"
        description={
          cancelling
            ? `اشتراک «${cancelling.planName}» لغو می‌شود.`
            : undefined
        }
        destructive
        requireReason
        confirmLabel="لغو اشتراک"
        onConfirm={async (reason) => {
          if (!cancelling) return;
          try {
            await cancelAdminProviderSubscription(cancelling.subscriptionId, {
              reason: reason ?? "",
            });
            toast.success("اشتراک لغو شد");
            setCancelling(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "لغو اشتراک ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
