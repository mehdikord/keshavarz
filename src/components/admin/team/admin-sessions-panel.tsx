"use client";

import { useCan, useAdminViewer } from "@/components/admin/shell/admin-context";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

import { type SessionRow, SessionsTable } from "./sessions-table";

export function AdminSessionsPanel({
  adminId,
  isSelf,
  isSuperAdmin,
  now,
  sessions,
}: {
  adminId: string;
  isSelf: boolean;
  isSuperAdmin: boolean;
  /** Render time from the server, so relative times match during hydration. */
  now: string;
  sessions: SessionRow[];
}) {
  const canManage = useCan(ADMIN_PERMISSIONS.adminsManage);
  const viewer = useAdminViewer();
  const editable = canManage && !isSelf && (!isSuperAdmin || viewer.isSuperAdmin);
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        description={
          isSelf
            ? "نشست‌های خودتان را از صفحه «حساب من» مدیریت کنید."
            : "دستگاه‌هایی که این مدیر در ۳۰ روز گذشته با آن‌ها وارد شده است."
        }
        title="نشست‌ها"
      />
      <div className="border-t border-line">
        <SessionsTable
          now={new Date(now)}
          onRevoke={editable ? (sessionId) => adminApi.post(`/team/admins/${adminId}/sessions/revoke`, { sessionId }) : undefined}
          sessions={sessions}
        />
      </div>
    </Panel>
  );
}
