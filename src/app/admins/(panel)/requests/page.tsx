import type { Metadata } from "next";

import { RequestsFilterBar } from "@/components/admin/requests/requests-filter-bar";
import { STATUS_TABS } from "@/components/admin/requests/request-labels";
import { RequestsTable } from "@/components/admin/requests/requests-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { RequestsListQuerySchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { listAdminRequests } from "@/server/modules/admin/requests/requests-admin.service";

export const metadata: Metadata = { title: "درخواست‌های خدمت" };

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.requestsView)) {
    return <AdminForbidden section="درخواست‌های خدمت" />;
  }

  const raw = await searchParams;
  const query = RequestsListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminRequests(query);
  const filtered = Boolean(query.q || query.service || query.period !== "all" || query.status !== "all");
  const open = list.counts.awaiting_send + list.counts.pending_provider + list.counts.in_progress;

  return (
    <UsersListFrame>
      <PageHeader
        description={`${faNumber(list.counts.all)} درخواست، ${faNumber(open)} مورد باز. با باز کردن هر درخواست، روند کامل، دعوت‌ها و اقدامات مدیریتی آن را ببینید.`}
        title="درخواست‌های خدمت"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت درخواست" tabs={STATUS_TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <RequestsFilterBar
              query={{ period: query.period, q: query.q, service: query.service, sort: query.sort }}
              serviceOptions={list.serviceOptions}
            />
          </div>
          <PendingArea>
            <RequestsTable filtered={filtered} items={list.items} now={new Date()} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
