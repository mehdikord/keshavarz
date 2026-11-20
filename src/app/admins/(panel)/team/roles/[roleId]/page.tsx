import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { AuditTimeline } from "@/components/admin/team/audit-entries";
import { RoleEditor } from "@/components/admin/team/role-editor";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { RoleParamsSchema } from "@/server/modules/admin/team/team.schemas";
import { getTeamRoleDetail } from "@/server/modules/admin/team/team.service";

type Params = Promise<{ roleId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const parsed = RoleParamsSchema.safeParse(await params);
  const detail = parsed.success ? await getTeamRoleDetail(parsed.data.roleId) : null;
  return { title: detail ? detail.role.name : "نقش پیدا نشد" };
}

export default async function RoleDetailPage({ params }: { params: Params }) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.rolesView)) {
    return <AdminForbidden section="نقش‌ها و دسترسی‌ها" />;
  }
  const parsed = RoleParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const detail = await getTeamRoleDetail(parsed.data.roleId);
  if (!detail) notFound();
  const { role } = detail;
  const canSeeAdmins = can(session.viewer.access, ADMIN_PERMISSIONS.adminsView);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "مدیران و دسترسی‌ها" }, { href: "/admins/team/roles", label: "نقش‌ها و دسترسی‌ها" }, { label: role.name }]}
        description={`ساخته شده ${formatDateTime(role.createdAt)}${role.createdBy ? ` توسط ${role.createdBy}` : ""} · آخرین تغییر ${formatDateTime(role.updatedAt)}`}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {role.name}
            {role.isSystem ? <Badge tone="wheat">نقش سیستمی</Badge> : null}
            {role.isActive ? null : <Badge tone="neutral">غیرفعال</Badge>}
          </span>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RoleEditor
          permissionCodes={detail.permissionCodes}
          role={{
            code: role.code,
            description: role.description,
            id: role.id,
            isActive: role.isActive,
            isSystem: role.isSystem,
            members: detail.members.length,
            name: role.name,
            permissions: role.permissions,
          }}
        />
        <div className="grid gap-5">
          <Panel className="overflow-hidden">
            <PanelHeader description="برای افزودن یا گرفتن نقش، به صفحه همان مدیر بروید." title={`اعضا (${faNumber(detail.members.length)})`} />
            {detail.members.length === 0 ? (
              <EmptyState className="py-8" title="این نقش به هیچ مدیری داده نشده" />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {detail.members.map((member) => {
                  const body = (
                    <>
                      <Avatar image={member.image} name={member.name} seed={member.id} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{member.name}</span>
                        <PhoneText className="text-[11.5px] text-muted-foreground" phone={member.phone} />
                      </span>
                      {member.isActive ? null : <Badge tone="neutral">غیرفعال</Badge>}
                      {member.expiresAt ? <Badge tone="warning">تا {formatDateTime(member.expiresAt)}</Badge> : null}
                    </>
                  );
                  return (
                    <li key={member.id}>
                      {canSeeAdmins ? (
                        <Link className="flex items-center gap-3 px-5 py-2.5 hover:bg-raised/70" href={`/admins/team/admins/${member.id}`}>
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <Panel className="overflow-hidden">
            <PanelHeader title="تاریخچه تغییرات" />
            <div className="border-t border-line">
              <AuditTimeline
                emptyTitle="تغییری ثبت نشده"
                entries={detail.history}
                linkEntries={can(session.viewer.access, ADMIN_PERMISSIONS.auditLogsView)}
                now={new Date()}
              />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
