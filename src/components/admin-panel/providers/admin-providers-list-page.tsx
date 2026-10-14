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
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import {
  fetchAdminProviders,
  type AdminProviderListItem,
} from "@/lib/api/admin-providers";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

export function AdminProvidersListPage() {
  const { can } = useAdminPermissions();
  const canView = can("providers.view");
  const router = useRouter();
  const list = useAdminUrlListState();

  const approved = list.get("approved") as "yes" | "no" | null;
  const isActive = list.get("isActive") as "0" | "1" | null;
  const isAvailable = list.get("isAvailable") as "0" | "1" | null;
  const urlQ = list.q;
  const setSearch = list.setSearch;

  const [searchDraft, setSearchDraft] = useState(urlQ);
  const [urlQSnapshot, setUrlQSnapshot] = useState(urlQ);
  const [filterOpen, setFilterOpen] = useState(false);
  const [approvedDraft, setApprovedDraft] = useState(approved ?? "all");
  const [activeDraft, setActiveDraft] = useState(isActive ?? "all");
  const [availableDraft, setAvailableDraft] = useState(isAvailable ?? "all");
  const [items, setItems] = useState<AdminProviderListItem[]>([]);
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

    void fetchAdminProviders({
      approved: approved ?? undefined,
      cursor: list.cursor,
      isActive: isActive ?? undefined,
      isAvailable: isAvailable ?? undefined,
      limit: list.limit,
      q: list.q || undefined,
      signal: controller.signal,
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
            : "بارگذاری Providerها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    approved,
    canView,
    isActive,
    isAvailable,
    list.cursor,
    list.limit,
    list.q,
    reloadKey,
  ]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (list.q) next.push({ id: "q", label: `جستجو: ${list.q}`, keys: ["q"] });
    if (approved === "yes") {
      next.push({ id: "approved", label: "تأییدشده", keys: ["approved"] });
    }
    if (approved === "no") {
      next.push({ id: "unapproved", label: "تأییدنشده", keys: ["approved"] });
    }
    if (isActive === "1") {
      next.push({ id: "active", label: "فعال", keys: ["isActive"] });
    }
    if (isActive === "0") {
      next.push({ id: "inactive", label: "غیرفعال", keys: ["isActive"] });
    }
    if (isAvailable === "1") {
      next.push({ id: "available", label: "در دسترس", keys: ["isAvailable"] });
    }
    if (isAvailable === "0") {
      next.push({
        id: "unavailable",
        label: "غیردردسترس",
        keys: ["isAvailable"],
      });
    }
    return next;
  }, [approved, isActive, isAvailable, list.q]);

  const columns: AdminDataTableColumn<AdminProviderListItem>[] = [
    {
      id: "name",
      header: "نام",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "phone",
      header: "موبایل",
      cell: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.phone}
        </span>
      ),
    },
    {
      id: "approved",
      header: "تأیید",
      cell: (row) => (
        <AdminStatusBadge
          status={row.approved ? "approved" : "pending"}
          label={row.approved ? "تأییدشده" : "در انتظار"}
        />
      ),
    },
    {
      id: "availability",
      header: "دسترسی",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <AdminStatusBadge
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? "فعال" : "غیرفعال"}
          />
          <AdminStatusBadge
            status={row.isAvailable ? "active" : "inactive"}
            label={row.isAvailable ? "آماده" : "غیرفعال کاری"}
          />
        </div>
      ),
    },
    {
      id: "radius",
      header: "شعاع",
      cell: (row) => (
        <span className="text-xs">{toPersianDigits(row.workRadiusKm)} km</span>
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
            onClick={() => void copyPublicId(row.providerId)}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/admins/providers/${row.providerId}`}>
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
        title="خدمات‌دهندگان"
        description="فهرست Providerها با فیلتر تأیید، فعال بودن و availability."
      />

      <AdminFilterBar
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        searchPlaceholder="نام یا موبایل..."
        onOpenFilters={() => {
          setApprovedDraft(approved ?? "all");
          setActiveDraft(isActive ?? "all");
          setAvailableDraft(isAvailable ?? "all");
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
              setApprovedDraft(approved ?? "all");
              setActiveDraft(isActive ?? "all");
              setAvailableDraft(isAvailable ?? "all");
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
          if (chip.keys?.[0] === "approved") {
            list.setFilters({ approved: null });
          } else if (chip.keys?.[0] === "isActive") {
            list.setFilters({ isActive: null });
          } else if (chip.keys?.[0] === "isAvailable") {
            list.setFilters({ isAvailable: null });
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
        getRowId={(row) => row.providerId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        onRowClick={(row) => router.push(`/admins/providers/${row.providerId}`)}
        emptyTitle="Providerی یافت نشد"
        emptyDescription="فیلترها را تغییر دهید."
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
          setApprovedDraft("all");
          setActiveDraft("all");
          setAvailableDraft("all");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            approved: approvedDraft === "all" ? null : approvedDraft,
            isActive: activeDraft === "all" ? null : activeDraft,
            isAvailable: availableDraft === "all" ? null : availableDraft,
          });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>وضعیت تأیید</Label>
            <Select value={approvedDraft} onValueChange={setApprovedDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="yes">تأییدشده</SelectItem>
                <SelectItem value="no">تأییدنشده</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>فعال بودن</Label>
            <Select value={activeDraft} onValueChange={setActiveDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="1">فعال</SelectItem>
                <SelectItem value="0">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select value={availableDraft} onValueChange={setAvailableDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="1">در دسترس</SelectItem>
                <SelectItem value="0">غیردردسترس</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminFilterDrawer>
    </div>
  );
}
