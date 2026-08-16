"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
} from "@/components/admin-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  fetchAdminPermissions,
  groupPermissionsByModule,
  type AdminPermission,
} from "@/lib/api/admin-rbac";
import { isApiClientError } from "@/lib/api/envelope";
import { toPersianDigits } from "@/lib/utils/format";

export function AdminPermissionsCatalogPage() {
  const { can } = useAdminPermissions();
  const canView = can("roles.view");
  const [items, setItems] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminPermissions(controller.signal)
      .then((permissions) => {
        if (controller.signal.aborted) return;
        setItems(permissions);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری مجوزها ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView]);

  const groups = useMemo(() => groupPermissionsByModule(items), [items]);

  if (!canView) return <AdminForbidden />;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <AdminSectionCard className="text-center text-sm text-destructive">
        {error}
      </AdminSectionCard>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="کاتالوگ مجوزها"
        description={`فهرست خواندنی مجوزها گروه‌بندی‌شده بر اساس module · ${toPersianDigits(items.length)} مورد`}
      />

      <div className="space-y-4">
        {groups.map((group) => (
          <AdminSectionCard key={group.module}>
            <h2 className="mb-3 text-sm font-semibold">{group.module}</h2>
            <ul className="divide-y divide-[var(--admin-border)]">
              {group.permissions.map((item) => (
                <li
                  key={item.permissionCode}
                  className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <code
                    className="font-mono text-[11px] text-muted-foreground"
                    dir="ltr"
                  >
                    {item.permissionCode}
                  </code>
                </li>
              ))}
            </ul>
          </AdminSectionCard>
        ))}
      </div>
    </div>
  );
}
