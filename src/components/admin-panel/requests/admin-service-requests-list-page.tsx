"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AdminCursorPagination,
  AdminDataTable,
  AdminFilterBar,
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
  REQUEST_STATUSES,
  fetchAdminServiceRequests,
  type AdminRequestListItem,
  type AdminRequestStatus,
} from "@/lib/api/admin-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice } from "@/lib/utils/format";

const STATUS_FILTER_LABELS: Record<AdminRequestStatus, string> = {
  pending_provider: "در انتظار تأیید",
  in_progress: "در حال انجام",
  completed: "پایان‌یافته",
  cancelled: "لغوشده",
};

function isRequestStatus(value: string | null): value is AdminRequestStatus {
  return REQUEST_STATUSES.includes(value as AdminRequestStatus);
}

export function AdminServiceRequestsListPage() {
  const { can } = useAdminPermissions();
  const canView = can("requests.view");
  const router = useRouter();
  const list = useAdminUrlListState();

  const statusParam = list.get("status");
  const status = isRequestStatus(statusParam) ? statusParam : null;
  const consumerUserId = list.get("consumerUserId");

  const urlQ = list.q;
  const setSearch = list.setSearch;
  const [searchDraft, setSearchDraft] = useState(urlQ);
  const [urlQSnapshot, setUrlQSnapshot] = useState(urlQ);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [consumerDraft, setConsumerDraft] = useState(consumerUserId ?? "");
  const [items, setItems] = useState<AdminRequestListItem[]>([]);
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

  if (urlQ !== urlQSnapshot) {
    setUrlQSnapshot(urlQ);
    setSearchDraft(urlQ);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft === urlQ) return;
      setLoading(true);
      setSearch(searchDraft);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, setSearch, urlQ]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminServiceRequests({
      consumerUserId: consumerUserId || undefined,
      cursor: list.cursor,
      limit: list.limit,
      q: list.q || undefined,
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
            : "بارگذاری درخواست‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    canView,
    consumerUserId,
    list.cursor,
    list.limit,
    list.q,
    reloadKey,
    status,
  ]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (list.q) {
      next.push({ id: "q", label: `شناسه: ${list.q}`, keys: ["q"] });
    }
    if (status) {
      next.push({
        id: "status",
        label: `وضعیت: ${STATUS_FILTER_LABELS[status]}`,
        keys: ["status"],
      });
    }
    if (consumerUserId) {
      next.push({
        id: "consumer",
        label: `مصرف‌کننده: ${consumerUserId}`,
        keys: ["consumerUserId"],
      });
    }
    return next;
  }, [consumerUserId, list.q, status]);

  const columns: AdminDataTableColumn<AdminRequestListItem>[] = [
    {
      id: "requestId",
      header: "شناسه",
      cell: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.requestId}
        </span>
      ),
    },
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      id: "service",
      header: "خدمت / زمین",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.serviceName}</p>
          <p className="text-xs text-muted-foreground">{row.landTitle}</p>
        </div>
      ),
    },
    {
      id: "consumer",
      header: "مصرف‌کننده",
      cell: (row) => (
        <Button asChild variant="link" className="h-auto p-0 text-xs" dir="ltr">
          <Link href={`/admins/users/${row.consumerUserId}`}>
            {row.consumerUserId}
          </Link>
        </Button>
      ),
    },
    {
      id: "provider",
      header: "Provider",
      cell: (row) => (
        <span className="text-sm">{row.assignedProviderName ?? "—"}</span>
      ),
    },
    {
      id: "price",
      header: "مبلغ",
      cell: (row) => (
        <span className="text-xs">
          {row.agreedPriceToman != null
            ? formatPrice(row.agreedPriceToman)
            : "—"}
        </span>
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
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => void copyPublicId(row.requestId, "شناسه درخواست")}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/admins/service-requests/${row.requestId}`}>
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
        title="درخواست‌های خدمت"
        description="جستجو با شناسه عمومی، فیلتر وضعیت و مشاهده چرخه درخواست."
      />

      <AdminFilterBar
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        searchPlaceholder="شناسه عمومی درخواست..."
        onOpenFilters={() => {
          setStatusDraft(status ?? "all");
          setConsumerDraft(consumerUserId ?? "");
          setFilterOpen(true);
        }}
        filtersActiveCount={chips.length}
        onReset={
          chips.length > 0
            ? () => {
                setLoading(true);
                setSearchDraft("");
                list.clearAll();
              }
            : undefined
        }
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-lg"
            onClick={() => {
              setStatusDraft(status ?? "all");
              setConsumerDraft(consumerUserId ?? "");
              setFilterOpen(true);
            }}
          >
            <Filter className="size-4" />
            فیلتر
          </Button>
        }
      />

      <AdminFilterChips
        chips={chips}
        onRemove={(chip) => {
          setLoading(true);
          if (chip.id === "q") {
            setSearchDraft("");
            list.setSearch("");
            return;
          }
          if (chip.keys?.[0] === "status") {
            list.setFilters({ status: null });
          } else if (chip.keys?.[0] === "consumerUserId") {
            list.setFilters({ consumerUserId: null });
          }
        }}
        onClearAll={() => {
          setLoading(true);
          setSearchDraft("");
          list.clearAll();
        }}
      />

      <AdminDataTable
        columns={columns}
        rows={items}
        getRowId={(row) => row.requestId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        onRowClick={(row) =>
          router.push(`/admins/service-requests/${row.requestId}`)
        }
        emptyTitle="درخواستی یافت نشد"
        emptyDescription="فیلتر یا شناسه را تغییر دهید."
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
          setConsumerDraft("");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            status: statusDraft === "all" ? null : statusDraft,
            consumerUserId: consumerDraft.trim() || null,
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
                {REQUEST_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_FILTER_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumer-filter">شناسه مصرف‌کننده</Label>
            <Input
              id="consumer-filter"
              value={consumerDraft}
              onChange={(event) => setConsumerDraft(event.target.value)}
              dir="ltr"
              className="font-mono text-xs"
              placeholder="Public ID کاربر"
            />
          </div>
        </div>
      </AdminFilterDrawer>
    </div>
  );
}
