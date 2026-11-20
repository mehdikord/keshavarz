import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import {
  Pagination,
  PendingArea,
  StatusTabs,
  UsersFilterBar,
  UsersListFrame,
} from "@/components/admin/users/users-list-controls";
import { UsersTable } from "@/components/admin/users/users-table";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { UsersListQuerySchema } from "@/server/modules/admin/users/users.schemas";
import { listAdminUsers } from "@/server/modules/admin/users/users.service";

export const metadata: Metadata = { title: "کاربران" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.usersView)) {
    return <AdminForbidden section="کاربران" />;
  }

  const raw = await searchParams;
  const query = UsersListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminUsers(query);
  const filtered = Boolean(query.q || query.province || query.role !== "all" || query.status !== "all");

  return (
    <UsersListFrame>
      <PageHeader
        description={`${faNumber(list.counts.all)} حساب کاربری. هر کاربر می‌تواند هم زمین ثبت کند و هم خدمات‌دهنده باشد.`}
        title="کاربران"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <UsersFilterBar
              provinces={list.provinces}
              query={{ province: query.province, q: query.q, role: query.role, sort: query.sort }}
            />
          </div>
          <PendingArea>
            <UsersTable filtered={filtered} items={list.items} now={new Date()} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
