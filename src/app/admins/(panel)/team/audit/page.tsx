import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { AuditFilterBar } from "@/components/admin/team/audit-filter-bar";
import { AuditTable } from "@/components/admin/team/audit-table";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { listAuditEntries } from "@/server/modules/admin/team/audit-viewer.service";
import { AuditListQuerySchema } from "@/server/modules/admin/team/team.schemas";

export const metadata: Metadata = { title: "گزارش ممیزی" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.auditLogsView)) {
    return <AdminForbidden section="گزارش ممیزی" />;
  }
  const raw = await searchParams;
  const query = AuditListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAuditEntries(query);
  const filtered = Boolean(query.action || query.actor || query.ip || query.module || query.subjectId || query.subjectType || query.period !== "all");

  return (
    <UsersListFrame>
      <PageHeader
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { label: "گزارش ممیزی" }]}
        description={`${faNumber(list.total)} رویداد${filtered ? " با این فیلترها" : ""}. هر تغییری که مدیران در پنل می‌دهند، با زمان، آی‌پی و مقدار قبل و بعد اینجا ثبت می‌شود و قابل ویرایش یا حذف نیست.`}
        title="گزارش ممیزی"
      />
      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4">
          <AuditFilterBar
            facets={list.facets}
            values={{
              action: query.action,
              actor: query.actor,
              ip: query.ip,
              module: query.module,
              period: query.period,
              subjectId: query.subjectId,
              subjectType: query.subjectType,
            }}
          />
        </div>
        <PendingArea>
          <AuditTable filtered={filtered} items={list.items} now={new Date()} />
          {list.total > 0 ? (
            <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
          ) : null}
        </PendingArea>
      </Panel>
    </UsersListFrame>
  );
}
