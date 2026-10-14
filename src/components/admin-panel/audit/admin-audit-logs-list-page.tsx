"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Filter } from "lucide-react";

import {
  AdminCursorPagination,
  AdminDataTable,
  AdminFilterChips,
  AdminFilterDrawer,
  AdminForbidden,
  AdminPageHeader,
  type AdminDataTableColumn,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import { useAdminUrlListState } from "@/hooks/admin/use-admin-url-list-state";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminCursorMeta, AdminFilterChip } from "@/lib/admin/search-params";
import {
  fetchAdminAuditLogs,
  type AdminAuditLog,
} from "@/lib/api/admin-audit";
import { isApiClientError } from "@/lib/api/envelope";

export function AdminAuditLogsListPage() {
  const { can } = useAdminPermissions();
  const canView = can("audit_logs.view");
  const list = useAdminUrlListState();

  const action = list.get("action");
  const adminId = list.get("adminId");
  const moduleFilter = list.get("module");
  const from = list.get("from");
  const to = list.get("to");

  const [filterOpen, setFilterOpen] = useState(false);
  const [actionDraft, setActionDraft] = useState(action ?? "");
  const [adminDraft, setAdminDraft] = useState(adminId ?? "");
  const [moduleDraft, setModuleDraft] = useState(moduleFilter ?? "");
  const [fromDraft, setFromDraft] = useState(from ?? "");
  const [toDraft, setToDraft] = useState(to ?? "");

  const [items, setItems] = useState<AdminAuditLog[]>([]);
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

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminAuditLogs({
      action: action || undefined,
      adminId: adminId || undefined,
      cursor: list.cursor,
      from: from || undefined,
      limit: list.limit,
      module: moduleFilter || undefined,
      signal: controller.signal,
      to: to || undefined,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError({
          message: isApiClientError(cause)
            ? cause.message
            : "بارگذاری audit logs ناموفق بود.",
          requestId: isApiClientError(cause) ? cause.requestId : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    action,
    adminId,
    canView,
    from,
    list.cursor,
    list.limit,
    moduleFilter,
    reloadKey,
    to,
  ]);

  const chips: AdminFilterChip[] = useMemo(() => {
    const next: AdminFilterChip[] = [];
    if (action)
      next.push({ id: "action", keys: ["action"], label: `اقدام: ${action}` });
    if (adminId)
      next.push({
        id: "adminId",
        keys: ["adminId"],
        label: `ادمین: ${adminId}`,
      });
    if (moduleFilter)
      next.push({
        id: "module",
        keys: ["module"],
        label: `ماژول: ${moduleFilter}`,
      });
    if (from) next.push({ id: "from", keys: ["from"], label: `از: ${from}` });
    if (to) next.push({ id: "to", keys: ["to"], label: `تا: ${to}` });
    return next;
  }, [action, adminId, from, moduleFilter, to]);

  const columns: AdminDataTableColumn<AdminAuditLog>[] = useMemo(
    () => [
      {
        id: "createdAt",
        header: "زمان",
        cell: (row) => formatAdminDateTime(row.createdAt),
      },
      {
        id: "module",
        header: "ماژول / اقدام",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.module}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.action}</p>
          </div>
        ),
      },
      {
        id: "adminId",
        header: "بازیگر",
        cell: (row) =>
          row.adminId ? (
            <span className="font-mono text-xs">{row.adminId}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "route",
        header: "مسیر",
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.httpMethod ? `${row.httpMethod} ` : ""}
            {row.route ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        stickyActions: true,
        cell: (row) => (
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link href={`/admins/audit-logs/${row.auditLogId}`}>
              <Eye className="size-3.5" />
              جزئیات
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  if (!canView) {
    return <AdminForbidden />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="گزارش ممیزی"
        description="لاگ‌های مدیریتی فقط خواندنی؛ داده‌های حساس طبق API redact شده‌اند."
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => {
              setActionDraft(action ?? "");
              setAdminDraft(adminId ?? "");
              setModuleDraft(moduleFilter ?? "");
              setFromDraft(from ?? "");
              setToDraft(to ?? "");
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
        onClearAll={() => {
          setLoading(true);
          list.setFilters({
            action: null,
            adminId: null,
            from: null,
            module: null,
            to: null,
          });
        }}
        onRemove={(chip) => {
          setLoading(true);
          const updates: Record<string, null> = {};
          for (const key of chip.keys ?? []) updates[key] = null;
          list.setFilters(updates);
        }}
      />

      <AdminDataTable
        columns={columns}
        error={error}
        getRowId={(row) => row.auditLogId}
        loading={loading}
        onRetry={() => setReloadKey((value) => value + 1)}
        rows={items}
      />

      <AdminCursorPagination
        canGoPrevious={Boolean(list.cursor) || list.cursorStack.length > 0}
        meta={meta}
        onLimitChange={(limit) => {
          setLoading(true);
          list.setLimit(limit);
        }}
        onNext={() => {
          if (!meta.nextCursor) return;
          setLoading(true);
          list.goNext(meta.nextCursor);
        }}
        onPrevious={() => {
          setLoading(true);
          list.goPrevious();
        }}
        pageItemCount={items.length}
      />

      <AdminFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => {
          setLoading(true);
          list.setFilters({
            action: actionDraft.trim() || null,
            adminId: adminDraft.trim() || null,
            from: fromDraft.trim() || null,
            module: moduleDraft.trim() || null,
            to: toDraft.trim() || null,
          });
          setFilterOpen(false);
        }}
        onReset={() => {
          setActionDraft("");
          setAdminDraft("");
          setModuleDraft("");
          setFromDraft("");
          setToDraft("");
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>اقدام</Label>
            <Input
              className="rounded-lg"
              value={actionDraft}
              onChange={(event) => setActionDraft(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>شناسه ادمین (public)</Label>
            <Input
              className="rounded-lg font-mono"
              value={adminDraft}
              onChange={(event) => setAdminDraft(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>ماژول</Label>
            <Input
              className="rounded-lg"
              value={moduleDraft}
              onChange={(event) => setModuleDraft(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>از (ISO UTC)</Label>
            <Input
              className="rounded-lg font-mono text-xs"
              placeholder="2026-01-01T00:00:00.000Z"
              value={fromDraft}
              onChange={(event) => setFromDraft(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>تا (ISO UTC)</Label>
            <Input
              className="rounded-lg font-mono text-xs"
              placeholder="2026-12-31T23:59:59.000Z"
              value={toDraft}
              onChange={(event) => setToDraft(event.target.value)}
            />
          </div>
        </div>
      </AdminFilterDrawer>
    </div>
  );
}
