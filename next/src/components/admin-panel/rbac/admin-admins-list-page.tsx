"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Filter, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";

import {
  mapApiFieldErrors,
  mapZodFieldErrors,
} from "@/components/admin-panel/catalog/catalog-form-errors";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import {
  createAdminAdmin,
  fetchAdminAdmins,
  type AdminSummary,
} from "@/lib/api/admin-rbac";
import { isApiClientError } from "@/lib/api/envelope";

const CreateAdminFormSchema = z.object({
  email: z.union([z.string().email("ایمیل معتبر نیست."), z.literal("")]),
  isSuperAdmin: z.boolean(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(128),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل ایرانی معتبر نیست."),
});

export function AdminAdminsListPage() {
  const { can } = useAdminPermissions();
  const canView = can("admins.view");
  const canManage = can("admins.manage");
  const router = useRouter();
  const list = useAdminUrlListState();

  const isActiveParam = list.get("isActive");
  const isActive =
    isActiveParam === "1" || isActiveParam === "true"
      ? true
      : isActiveParam === "0" || isActiveParam === "false"
        ? false
        : null;

  const urlQ = list.q;
  const setSearch = list.setSearch;
  const [searchDraft, setSearchDraft] = useState(urlQ);
  const [urlQSnapshot, setUrlQSnapshot] = useState(urlQ);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(
    isActive === null ? "all" : isActive ? "1" : "0",
  );
  const [items, setItems] = useState<AdminSummary[]>([]);
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
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState({
    email: "",
    isSuperAdmin: false,
    name: "",
    password: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

    void fetchAdminAdmins({
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
            : "بارگذاری مدیران ناموفق بود.",
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
    if (isActive === true) {
      next.push({ id: "active", label: "فعال", keys: ["isActive"] });
    }
    if (isActive === false) {
      next.push({ id: "inactive", label: "غیرفعال", keys: ["isActive"] });
    }
    return next;
  }, [isActive, list.q]);

  const columns: AdminDataTableColumn<AdminSummary>[] = [
    {
      id: "name",
      header: "نام",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.phone}
          </p>
        </div>
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
          {row.isSuperAdmin ? (
            <AdminStatusBadge status="approved" label="Super Admin" />
          ) : null}
        </div>
      ),
    },
    {
      id: "email",
      header: "ایمیل",
      cell: (row) => (
        <span className="text-xs" dir="ltr">
          {row.email ?? "—"}
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
        <Button asChild size="sm" variant="outline" className="h-8">
          <Link href={`/admins/admins/${row.adminId}`}>
            <Eye className="size-3.5" />
            جزئیات
          </Link>
        </Button>
      ),
    },
  ];

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="مدیران"
        description="مدیریت حساب‌های ادمین، نقش‌ها و وضعیت دسترسی."
        actions={
          canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCreateValues({
                  email: "",
                  isSuperAdmin: false,
                  name: "",
                  password: "",
                  phone: "",
                });
                setFieldErrors({});
                setCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              مدیر جدید
            </Button>
          ) : null
        }
      />

      <AdminFilterBar
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        searchPlaceholder="نام یا موبایل..."
        onOpenFilters={() => {
          setActiveDraft(isActive === null ? "all" : isActive ? "1" : "0");
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
              setActiveDraft(isActive === null ? "all" : isActive ? "1" : "0");
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
          list.setFilters({ isActive: null });
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
        getRowId={(row) => row.adminId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        onRowClick={(row) => router.push(`/admins/admins/${row.adminId}`)}
        emptyTitle="مدیری یافت نشد"
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
      </AdminFilterDrawer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ایجاد مدیر</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              setFieldErrors({});
              const parsed = CreateAdminFormSchema.safeParse(createValues);
              if (!parsed.success) {
                setFieldErrors(mapZodFieldErrors(parsed.error.issues));
                return;
              }
              setSubmitting(true);
              try {
                const created = await createAdminAdmin({
                  email: parsed.data.email || null,
                  isSuperAdmin: parsed.data.isSuperAdmin,
                  name: parsed.data.name,
                  password: parsed.data.password,
                  phone: parsed.data.phone,
                });
                toast.success("مدیر ایجاد شد");
                setCreateOpen(false);
                router.push(`/admins/admins/${created.adminId}`);
              } catch (cause) {
                toast.error(
                  isApiClientError(cause)
                    ? cause.message
                    : "ایجاد مدیر ناموفق بود.",
                );
                setFieldErrors(mapApiFieldErrors(cause));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>نام</Label>
                <Input
                  value={createValues.name}
                  onChange={(event) =>
                    setCreateValues((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  disabled={submitting}
                />
                {fieldErrors.name ? (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>موبایل</Label>
                <Input
                  value={createValues.phone}
                  onChange={(event) =>
                    setCreateValues((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  disabled={submitting}
                  dir="ltr"
                  className="font-mono"
                />
                {fieldErrors.phone ? (
                  <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>ایمیل (اختیاری)</Label>
                <Input
                  value={createValues.email}
                  onChange={(event) =>
                    setCreateValues((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  disabled={submitting}
                  dir="ltr"
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>رمز عبور اولیه</Label>
                <Input
                  type="password"
                  value={createValues.password}
                  onChange={(event) =>
                    setCreateValues((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  disabled={submitting}
                  dir="ltr"
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors.password}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">حداقل ۱۲ کاراکتر</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Super Admin</Label>
                <Select
                  value={createValues.isSuperAdmin ? "1" : "0"}
                  onValueChange={(value) =>
                    setCreateValues((prev) => ({
                      ...prev,
                      isSuperAdmin: value === "1",
                    }))
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">خیر</SelectItem>
                    <SelectItem value="1">بله</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setCreateOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال ایجاد..." : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
