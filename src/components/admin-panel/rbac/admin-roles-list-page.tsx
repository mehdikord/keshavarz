"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import {
  mapApiFieldErrors,
  mapZodFieldErrors,
} from "@/components/admin-panel/catalog/catalog-form-errors";
import {
  AdminConfirmDialog,
  AdminDataTable,
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
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { formatAdminDateTime } from "@/lib/admin/format";
import {
  RoleCodeClientSchema,
  createAdminRole,
  deleteAdminRole,
  fetchAdminRoles,
  patchAdminRole,
  type AdminRole,
} from "@/lib/api/admin-rbac";
import { isApiClientError } from "@/lib/api/envelope";

const RoleFormSchema = z.object({
  code: RoleCodeClientSchema,
  description: z.string().trim().max(500).optional(),
  name: z.string().trim().min(2).max(120),
});

export function AdminRolesListPage() {
  const { can } = useAdminPermissions();
  const canView = can("roles.view");
  const canManage = can("roles.manage");

  const [items, setItems] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [values, setValues] = useState({
    code: "",
    description: "",
    name: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<AdminRole | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminRoles(controller.signal)
      .then((roles) => {
        if (controller.signal.aborted) return;
        setItems(roles);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری نقش‌ها ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, reloadKey]);

  const columns: AdminDataTableColumn<AdminRole>[] = [
    {
      id: "name",
      header: "نقش",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {row.roleId}
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
          {row.isSystem ? (
            <AdminStatusBadge status="pending" label="سیستمی" />
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
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href={`/admins/roles/${row.roleId}`}>
              <Eye className="size-3.5" />
              مجوزها
            </Link>
          </Button>
          {canManage ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => {
                  setEditing(row);
                  setValues({
                    code: row.roleId,
                    description: row.description ?? "",
                    name: row.name,
                  });
                  setFieldErrors({});
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              {!row.isSystem ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-destructive"
                  onClick={() => setDeleting(row)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
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
        title="نقش‌ها"
        description="CRUD نقش‌ها و تخصیص مجوز. نقش‌های سیستمی قابل حذف نیستند."
        actions={
          canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setValues({ code: "", description: "", name: "" });
                setFieldErrors({});
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              نقش جدید
            </Button>
          ) : null
        }
      />

      <AdminDataTable
        columns={columns}
        rows={items}
        getRowId={(row) => row.roleId}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        emptyTitle="نقشی یافت نشد"
        emptyDescription="نقش جدید بسازید."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش نقش" : "ایجاد نقش"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              setFieldErrors({});
              const parsed = RoleFormSchema.safeParse(values);
              if (!parsed.success) {
                setFieldErrors(mapZodFieldErrors(parsed.error.issues));
                return;
              }
              setSubmitting(true);
              try {
                if (editing) {
                  const body: {
                    code?: string;
                    description?: string | null;
                    name: string;
                  } = {
                    name: parsed.data.name,
                    description: parsed.data.description?.trim() || null,
                  };
                  if (!editing.isSystem) {
                    body.code = parsed.data.code;
                  }
                  await patchAdminRole(editing.roleId, body);
                  toast.success("نقش به‌روزرسانی شد");
                } else {
                  await createAdminRole({
                    code: parsed.data.code,
                    description: parsed.data.description?.trim() || null,
                    name: parsed.data.name,
                  });
                  toast.success("نقش ایجاد شد");
                }
                setFormOpen(false);
                setLoading(true);
                setReloadKey((value) => value + 1);
              } catch (cause) {
                toast.error(
                  isApiClientError(cause)
                    ? cause.message
                    : "ذخیره نقش ناموفق بود.",
                );
                setFieldErrors(mapApiFieldErrors(cause));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label>نام</Label>
              <Input
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
                disabled={submitting}
              />
              {fieldErrors.name ? (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>کد</Label>
              <Input
                value={values.code}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, code: event.target.value }))
                }
                disabled={submitting || Boolean(editing?.isSystem)}
                dir="ltr"
                className="font-mono text-xs"
              />
              {fieldErrors.code ? (
                <p className="text-xs text-destructive">{fieldErrors.code}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>توضیح</Label>
              <Textarea
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                disabled={submitting}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setFormOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال ذخیره..." : "ذخیره"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف نقش"
        description={
          deleting
            ? `نقش «${deleting.name}» حذف می‌شود. نقش سیستمی قابل حذف نیست.`
            : undefined
        }
        destructive
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAdminRole(deleting.roleId);
            toast.success("نقش حذف شد");
            setDeleting(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          } catch (cause) {
            toast.error(
              isApiClientError(cause) ? cause.message : "حذف نقش ناموفق بود.",
            );
          }
        }}
      />
    </div>
  );
}
