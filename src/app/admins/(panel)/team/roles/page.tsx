import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { NewRoleButton, RolesList, RolesSearch } from "@/components/admin/team/roles-list";
import { Panel } from "@/components/admin/ui/panel";
import { PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { RolesListQuerySchema } from "@/server/modules/admin/team/team.schemas";
import { listTeamRoles } from "@/server/modules/admin/team/team.service";

export const metadata: Metadata = { title: "نقش‌ها و دسترسی‌ها" };

const TABS = [
  { key: "all", label: "همه" },
  { key: "assigned", label: "دارای عضو" },
  { key: "unassigned", label: "بدون عضو" },
  { key: "inactive", label: "غیرفعال" },
] as const;

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.rolesView)) {
    return <AdminForbidden section="نقش‌ها و دسترسی‌ها" />;
  }
  const raw = await searchParams;
  const query = RolesListQuerySchema.parse({
    q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
    view: Array.isArray(raw.status) ? raw.status[0] : raw.status,
  });
  const list = await listTeamRoles(query);

  return (
    <UsersListFrame>
      <PageHeader
        actions={<NewRoleButton />}
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { label: "نقش‌ها و دسترسی‌ها" }]}
        description={`${faNumber(list.counts.all)} نقش. هر نقش مجموعه‌ای از دسترسی‌هاست؛ دسترسی هر مدیر برابر است با جمع نقش‌هایش، به‌اضافه استثناهای «اجازه» و منهای استثناهای «منع».`}
        title="نقش‌ها و دسترسی‌ها"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.view} label="نمای نقش‌ها" tabs={TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <RolesSearch initial={query.q} />
          </div>
          <PendingArea>
            <RolesList filtered={Boolean(query.q || query.view !== "all")} items={list.items} totalPermissions={list.permissionCodes.length} />
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
