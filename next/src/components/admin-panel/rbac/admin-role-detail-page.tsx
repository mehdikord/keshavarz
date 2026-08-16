"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminConfirmDialog,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  fetchAdminPermissions,
  fetchAdminRolePermissions,
  groupPermissionsByModule,
  replaceAdminRolePermissions,
  type AdminPermission,
  type AdminRole,
} from "@/lib/api/admin-rbac";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

interface AdminRoleDetailPageProps {
  roleId: string;
}

export function AdminRoleDetailPage({ roleId }: AdminRoleDetailPageProps) {
  const { can } = useAdminPermissions();
  const canView = can("roles.view");
  const canManage = can("roles.manage");

  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void Promise.all([
      fetchAdminRolePermissions(roleId, controller.signal),
      fetchAdminPermissions(controller.signal),
    ])
      .then(([roleResult, catalog]) => {
        if (controller.signal.aborted) return;
        setRole(roleResult.role);
        setSelected(roleResult.permissionCodes);
        setPermissions(catalog);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری نقش ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, roleId]);

  const groups = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions],
  );

  if (!canView) return <AdminForbidden />;

  if (loading && !role) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error ?? "نقش یافت نشد."}
      </AdminSectionCard>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title={role.name}
        description="تخصیص مجوزهای نقش با جایگزینی کامل."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admins/roles">بازگشت به نقش‌ها</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AdminStatusBadge
          status={role.isActive ? "active" : "inactive"}
          label={role.isActive ? "فعال" : "غیرفعال"}
        />
        {role.isSystem ? (
          <AdminStatusBadge status="pending" label="سیستمی" />
        ) : null}
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
          {role.roleId}
        </span>
        <span className="text-xs text-muted-foreground">
          انتخاب‌شده: {toPersianDigits(selected.length)}
        </span>
      </div>

      <AdminSectionCard>
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.module}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{group.module}</h2>
                {canManage ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      const codes = group.permissions.map(
                        (item) => item.permissionCode,
                      );
                      const allSelected = codes.every((code) =>
                        selected.includes(code),
                      );
                      setSelected((prev) => {
                        if (allSelected) {
                          return prev.filter((code) => !codes.includes(code));
                        }
                        return [...new Set([...prev, ...codes])];
                      });
                    }}
                  >
                    انتخاب/لغو ماژول
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.permissions.map((item) => {
                  const checked = selected.includes(item.permissionCode);
                  return (
                    <label
                      key={item.permissionCode}
                      className="flex items-start gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!canManage}
                        onCheckedChange={(value) => {
                          setSelected((prev) => {
                            if (value) {
                              return [
                                ...new Set([...prev, item.permissionCode]),
                              ];
                            }
                            return prev.filter(
                              (code) => code !== item.permissionCode,
                            );
                          });
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {item.name}
                        </span>
                        <span
                          className="block font-mono text-[11px] text-muted-foreground"
                          dir="ltr"
                        >
                          {item.permissionCode}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {canManage ? (
          <Button
            type="button"
            className="mt-6"
            disabled={saving}
            onClick={() => setConfirmOpen(true)}
          >
            ذخیره مجوزهای نقش
          </Button>
        ) : null}
      </AdminSectionCard>

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="تأیید ذخیره مجوزهای نقش"
        description="مجوزهای نقش به‌طور کامل جایگزین می‌شوند و کش دسترسی ادمین‌ها باطل می‌گردد."
        confirmLabel="ذخیره"
        onConfirm={async () => {
          setSaving(true);
          try {
            const result = await replaceAdminRolePermissions(roleId, {
              permissionCodes: selected,
            });
            setRole(result.role);
            setSelected(result.permissionCodes);
            toast.success("مجوزهای نقش ذخیره شد");
            setConfirmOpen(false);
          } catch (cause) {
            toast.error(
              isApiClientError(cause)
                ? cause.message
                : "ذخیره مجوزها ناموفق بود.",
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
