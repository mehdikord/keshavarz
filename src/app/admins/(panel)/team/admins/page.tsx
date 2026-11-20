import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { AddAdminButton } from "@/components/admin/team/admin-form-dialog";
import { AdminsFilterBar } from "@/components/admin/team/admins-filter-bar";
import { AdminsTable } from "@/components/admin/team/admins-table";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { AdminsListQuerySchema } from "@/server/modules/admin/team/team.schemas";
import { listTeamAdmins } from "@/server/modules/admin/team/team.service";

export const metadata: Metadata = { title: "مدیران" };

const TABS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
  { key: "locked", label: "قفل‌شده" },
] as const;

export default async function AdminTeamAdminsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.adminsView)) {
    return <AdminForbidden section="مدیران" />;
  }
  const raw = await searchParams;
  const query = AdminsListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listTeamAdmins(query);

  return (
    <UsersListFrame>
      <PageHeader
        actions={<AddAdminButton roles={list.roles} />}
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { label: "مدیران" }]}
        description={`${faNumber(list.counts.all)} حساب مدیر. هر مدیر با شماره موبایل و رمز عبور وارد می‌شود و فقط به بخش‌هایی که نقش‌هایش اجازه می‌دهد دسترسی دارد.`}
        title="مدیران"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت مدیر" tabs={TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <AdminsFilterBar query={{ q: query.q, role: query.role }} roles={list.roles} />
          </div>
          <PendingArea>
            <AdminsTable filtered={Boolean(query.q || query.role || query.status !== "all")} items={list.items} now={new Date()} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
