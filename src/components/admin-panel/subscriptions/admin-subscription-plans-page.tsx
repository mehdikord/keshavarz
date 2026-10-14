"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { AdminPlanFormDialog } from "@/components/admin-panel/subscriptions/admin-plan-form-dialog";
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
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminFilterChip } from "@/lib/admin/search-params";
import {
  deleteAdminSubscriptionPlan,
  fetchAdminSubscriptionPlans,
  type AdminSubscriptionPlan,
} from "@/lib/api/admin-subscriptions";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

export function AdminSubscriptionPlansPage() {
  const { can } = useAdminPermissions();
  const canView = can("subscriptions.view");
  const canManage = can("subscriptions.manage");
  const canExport = can("payments.export");
  const list = useAdminUrlListState();
  const isActive = list.get("isActive") as "0" | "1" | null;
  const includeDeleted = list.get("includeDeleted") === "1";

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(isActive ?? "all");
  const [deletedDraft, setDeletedDraft] = useState(
    includeDeleted ? "1" : "0",
  );
  const [items, setItems] = useState<AdminSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState<AdminSubscriptionPlan | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminSubscriptionPlans({
      includeDeleted,
      isActive: isActive ?? undefined,
      signal: controller.signal,
    })
      .then((plans) => {
        if (controller.signal.aborted) return;
        setItems(plans);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری پلن‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, includeDeleted, isActive, reloadKey]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (isActive === "1") {
      next.push({ id: "active", label: "فعال", keys: ["isActive"] });
    }
    if (isActive === "0") {
      next.push({ id: "inactive", label: "غیرفعال", keys: ["isActive"] });
    }
    if (includeDeleted) {
      next.push({
        id: "deleted",
        label: "شامل حذف‌شده‌ها",
        keys: ["includeDeleted"],
      });
    }
    return next;
  }, [includeDeleted, isActive]);

  const columns: AdminDataTableColumn<AdminSubscriptionPlan>[] = [
    {
      id: "name",
      header: "پلن",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {row.name}
            {row.isRecommended ? (
              <span className="mr-2 text-[11px] text-primary">پیشنهادی</span>
            ) : null}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.code}
          </p>
        </div>
      ),
    },
    {
      id: "price",
      header: "قیمت",
      cell: (row) => (
        <span className="text-xs">{formatPrice(row.priceToman)}</span>
      ),
    },
    {
      id: "duration",
      header: "مدت",
      cell: (row) => (
        <span className="text-xs">
          {toPersianDigits(row.durationMonths)} ماه
        </span>
      ),
    },
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <AdminStatusBadge
            status={row.isActive ? "active" : "inactive"}
            label={row.isActive ? "فعال" : "غیرفعال"}
          />
          {row.deletedAt ? (
            <AdminStatusBadge status="cancelled" label="حذف‌شده" />
          ) : null}
        </div>
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
      cell: (row) =>
        canManage && !row.deletedAt ? (
          <div className="flex items-center gap-1">
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
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="پلن‌های اشتراک"
        description="مدیریت قیمت، مدت و ویژگی‌های پلن‌های اشتراک Provider."
        actions={
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admins/exports?domain=payments">
                  <Download className="size-4" />
                  خروجی (فاز ۰۹)
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                پلن جدید
              </Button>
            ) : null}
          </div>
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
            setDeletedDraft(includeDeleted ? "1" : "0");
            setFilterOpen(true);
          }}
        >
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
          if (chip.keys?.[0] === "isActive") {
            list.setFilters({ isActive: null });
          } else if (chip.keys?.[0] === "includeDeleted") {
            list.setFilters({ includeDeleted: null });
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
        getRowId={(row) => row.planId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        emptyTitle="پلنی یافت نشد"
        emptyDescription="پلن جدید بسازید یا فیلتر را تغییر دهید."
      />

      <AdminFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onReset={() => {
          setActiveDraft("all");
          setDeletedDraft("0");
        }}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            isActive: activeDraft === "all" ? null : activeDraft,
            includeDeleted: deletedDraft === "1" ? "1" : null,
          });
        }}
      >
        <div className="space-y-4">
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
          <div className="space-y-2">
            <Label>حذف‌شده‌ها</Label>
            <Select value={deletedDraft} onValueChange={setDeletedDraft}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">مخفی</SelectItem>
                <SelectItem value="1">نمایش</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminFilterDrawer>

      <AdminPlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editing}
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
        title="حذف پلن"
        description={
          deleting
            ? `پلن «${deleting.name}» به‌صورت soft-delete حذف می‌شود.`
            : undefined
        }
        destructive
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAdminSubscriptionPlan(deleting.planId);
            toast.success("پلن حذف شد");
            setDeleting(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause) ? cause.message : "حذف پلن ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
