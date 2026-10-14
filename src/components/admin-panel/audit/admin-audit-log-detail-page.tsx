"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { formatAdminDateTime } from "@/lib/admin/format";
import {
  fetchAdminAuditLog,
  type AdminAuditLog,
} from "@/lib/api/admin-audit";
import { isApiClientError } from "@/lib/api/envelope";

export function AdminAuditLogDetailPage({
  auditLogId,
}: {
  auditLogId: string;
}) {
  const { can } = useAdminPermissions();
  const canView = can("audit_logs.view");
  const [item, setItem] = useState<AdminAuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminAuditLog(auditLogId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItem(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause) ? cause.message : "بارگذاری جزئیات ناموفق بود.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [auditLogId, canView]);

  if (!canView) return <AdminForbidden />;

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="جزئیات ممیزی"
        description="نمایش فقط‌خواندنی یک رکورد audit."
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/admins/audit-logs">
              <ArrowRight className="size-4" />
              بازگشت
            </Link>
          </Button>
        }
      />

      {loading ? (
        <AdminSectionCard>
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        </AdminSectionCard>
      ) : error ? (
        <AdminSectionCard>
          <p className="text-sm text-destructive">{error}</p>
        </AdminSectionCard>
      ) : item ? (
        <>
          <dl className="grid gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">شناسه</dt>
              <dd className="font-mono text-sm">{item.auditLogId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">زمان</dt>
              <dd className="text-sm">{formatAdminDateTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ماژول</dt>
              <dd className="text-sm">{item.module}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">اقدام</dt>
              <dd className="font-mono text-sm">{item.action}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ادمین</dt>
              <dd className="font-mono text-sm">{item.adminId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">مسیر</dt>
              <dd className="font-mono text-xs">
                {item.httpMethod ? `${item.httpMethod} ` : ""}
                {item.route ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">IP</dt>
              <dd className="font-mono text-sm">{item.ipAddress ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">User-Agent</dt>
              <dd className="truncate text-xs">{item.userAgent ?? "—"}</dd>
            </div>
          </dl>

          <JsonBlock title="metadata" value={item.metadata} />
          <JsonBlock title="oldValues" value={item.oldValues} />
          <JsonBlock title="newValues" value={item.newValues} />
        </>
      ) : null}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <pre
        className="max-h-80 overflow-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed"
        dir="ltr"
      >
        {value == null ? "null" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
