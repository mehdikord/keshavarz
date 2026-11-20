import type { Metadata } from "next";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { RoleEditor } from "@/components/admin/team/role-editor";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { listPermissions } from "@/server/modules/admin/team/team.repository";

export const metadata: Metadata = { title: "نقش جدید" };

export default async function NewRolePage() {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.rolesManage)) {
    return <AdminForbidden section="ساخت نقش" />;
  }
  const permissions = await listPermissions();
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { href: "/admins/team/roles", label: "نقش‌ها و دسترسی‌ها" }, { label: "نقش جدید" }]}
        description="نام نقش را بنویسید و دسترسی‌هایی را که اعضای آن لازم دارند تیک بزنید."
        title="نقش جدید"
      />
      <RoleEditor permissionCodes={permissions.filter((row) => row.isActive === 1).map((row) => row.code)} />
    </>
  );
}
