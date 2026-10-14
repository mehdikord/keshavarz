"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminServiceFormDialog } from "@/components/admin-panel/catalog/admin-service-form-dialog";
import {
  AdminConfirmDialog,
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
import { copyPublicId, formatAdminDateTime } from "@/lib/admin/format";
import type { AdminFilterChip } from "@/lib/admin/search-params";
import {
  deleteAdminService,
  fetchAdminCategories,
  fetchAdminServices,
  type AdminCategory,
  type AdminService,
} from "@/lib/api/admin-catalog";
import { isApiClientError } from "@/lib/api/envelope";

export function AdminServicesPage() {
  const { can } = useAdminPermissions();
  const canView = can("catalog.view");
  const canManage = can("catalog.manage");
  const list = useAdminUrlListState();
  const isActive = list.get("isActive") as "0" | "1" | null;
  const categoryId = list.get("categoryId");

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(isActive ?? "all");
  const [categoryDraft, setCategoryDraft] = useState(categoryId ?? "all");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [items, setItems] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [deleting, setDeleting] = useState<AdminService | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminCategories({ signal: controller.signal })
      .then((rows) => {
        if (!controller.signal.aborted) setCategories(rows);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCategories([]);
      });

    return () => controller.abort();
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminServices({
      categoryId: categoryId || undefined,
      isActive: isActive ?? undefined,
      signal: controller.signal,
    })
      .then((services) => {
        if (controller.signal.aborted) return;
        setItems(services);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری خدمات ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, categoryId, isActive, reloadKey]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (categoryId) {
      const category = categories.find((item) => item.categoryId === categoryId);
      next.push({
        id: "category",
        label: `دسته: ${category?.name ?? categoryId}`,
        keys: ["categoryId"],
      });
    }
    if (isActive === "1") {
      next.push({ id: "active", label: "فعال", keys: ["isActive"] });
    }
    if (isActive === "0") {
      next.push({ id: "inactive", label: "غیرفعال", keys: ["isActive"] });
    }
    return next;
  }, [categories, categoryId, isActive]);

  const columns: AdminDataTableColumn<AdminService>[] = [
    {
      id: "name",
      header: "نام",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.serviceId}
          </p>
        </div>
      ),
    },
    {
      id: "category",
      header: "دسته",
      cell: (row) => <span className="text-sm">{row.category.name}</span>,
    },
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => (
        <AdminStatusBadge
          status={row.isActive ? "active" : "inactive"}
          label={row.isActive ? "فعال" : "غیرفعال"}
        />
      ),
    },
    {
      id: "sortOrder",
      header: "ترتیب",
      cell: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.sortOrder}
        </span>
      ),
    },
    {
      id: "updatedAt",
      header: "به‌روزرسانی",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDateTime(row.updatedAt)}
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
            onClick={() => void copyPublicId(row.serviceId, "شناسه خدمت")}
          >
            <Copy className="size-3.5" />
          </Button>
          {canManage ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
                ویرایش
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-destructive"
                onClick={() => setDeleting(row)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="خدمات کاتالوگ"
        description="مدیریت خدمات با فیلتر دسته و وضعیت."
        actions={
          canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              خدمت جدید
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
            setActiveDraft(isActive ?? "all");
            setCategoryDraft(categoryId ?? "all");
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
            className="h-10 rounded-lg"
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
          if (chip.keys?.[0] === "categoryId") {
            list.setFilters({ categoryId: null });
          } else if (chip.keys?.[0] === "isActive") {
            list.setFilters({ isActive: null });
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
        getRowId={(row) => row.serviceId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        emptyTitle="خدمتی یافت نشد"
        emptyDescription="خدمت جدید بسازید یا فیلتر را تغییر دهید."
      />

      <AdminFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onReset={() => {
          setActiveDraft("all");
          setCategoryDraft("all");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            categoryId: categoryDraft === "all" ? null : categoryDraft,
            isActive: activeDraft === "all" ? null : activeDraft,
          });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>دسته</Label>
            <Select value={categoryDraft} onValueChange={setCategoryDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.categoryId} value={item.categoryId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>وضعیت</Label>
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
        </div>
      </AdminFilterDrawer>

      <AdminServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        categories={categories}
        defaultCategoryId={categoryId}
        onSaved={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
      />

      <AdminConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف خدمت"
        description={
          deleting
            ? `خدمت «${deleting.name}» حذف می‌شود. اگر سابقه Provider یا درخواست داشته باشد سرور 409 برمی‌گرداند.`
            : undefined
        }
        destructive
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAdminService(deleting.serviceId);
            toast.success("خدمت حذف شد");
            setDeleting(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "حذف خدمت ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
