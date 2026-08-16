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
  fetchAdminUsers,
  type AdminUserListItem,
} from "@/lib/api/admin-users";
import { isApiClientError } from "@/lib/api/envelope";

export function AdminUsersListPage() {
  const { can } = useAdminPermissions();
  const canView = can("users.view");
  const router = useRouter();
  const list = useAdminUrlListState();

  const isActive = list.get("isActive") as "0" | "1" | null;
  const urlQ = list.q;
  const setSearch = list.setSearch;
  const [searchDraft, setSearchDraft] = useState(urlQ);
  const [urlQSnapshot, setUrlQSnapshot] = useState(urlQ);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(isActive ?? "all");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
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

    void fetchAdminUsers({
      cursor: list.cursor,
      isActive: isActive ?? undefined,
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
            : "بارگذاری کاربران ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, isActive, list.cursor, list.limit, list.q, reloadKey]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (list.q) next.push({ id: "q", label: `جستجو: ${list.q}`, keys: ["q"] });
    if (isActive === "1") {
      next.push({ id: "active", label: "وضعیت: فعال", keys: ["isActive"] });
    }
    if (isActive === "0") {
      next.push({
        id: "inactive",
        label: "وضعیت: غیرفعال",
        keys: ["isActive"],
      });
    }
    return next;
  }, [isActive, list.q]);

  const columns: AdminDataTableColumn<AdminUserListItem>[] = [
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
      id: "status",
      header: "وضعیت",
      cell: (row) => (
        <AdminStatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "lastLoginAt",
      header: "آخرین ورود",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.lastLoginAt)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "عضویت",
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
            onClick={() => void copyPublicId(row.userId)}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/admins/users/${row.userId}`}>
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
        title="کاربران"
        description="جستجو، فیلتر و moderation کاربران پلتفرم."
      />

      <AdminFilterBar
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        searchPlaceholder="نام یا موبایل..."
        onOpenFilters={() => {
          setActiveDraft(isActive ?? "all");
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
              setActiveDraft(isActive ?? "all");
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
          } else {
            list.setFilters({ isActive: null });
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
        getRowId={(row) => row.userId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        onRowClick={(row) => router.push(`/admins/users/${row.userId}`)}
        emptyTitle="کاربری یافت نشد"
        emptyDescription="فیلتر یا جستجو را تغییر دهید."
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
        onReset={() => setActiveDraft("all")}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            isActive: activeDraft === "all" ? null : activeDraft,
          });
        }}
      >
        <div className="space-y-2">
          <Label>وضعیت فعال بودن</Label>
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
      </AdminFilterDrawer>
    </div>
  );
}
