import type { Metadata } from "next";
import { Crown, Lock } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { Breadcrumbs } from "@/components/admin/shell/page-header";
import { AdminDetailActions } from "@/components/admin/team/admin-detail-actions";
import { OverridesPanel, RolesPanel } from "@/components/admin/team/admin-access-panels";
import { AdminSessionsPanel } from "@/components/admin/team/admin-sessions-panel";
import { AdminStatusBadge } from "@/components/admin/team/admins-table";
import { AuditTimeline } from "@/components/admin/team/audit-entries";
import { EffectivePermissions, type PermissionSource } from "@/components/admin/team/permission-matrix";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Ltr, PhoneText } from "@/components/admin/ui/ltr";
import { DescriptionList, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { AdminParamsSchema } from "@/server/modules/admin/team/team.schemas";
import { getRoleOptions, getTeamAdminDetail, type TeamAdminDetail } from "@/server/modules/admin/team/team.service";

type Params = Promise<{ adminId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const parsed = AdminParamsSchema.safeParse(await params);
  const detail = parsed.success ? await getTeamAdminDetail(parsed.data.adminId) : null;
  return { title: detail ? detail.admin.name : "مدیر پیدا نشد" };
}

function permissionSources(detail: TeamAdminDetail) {
  const sources: Record<string, { denied: boolean; granted: PermissionSource[] }> = {};
  const entry = (code: string) => (sources[code] ??= { denied: false, granted: [] });
  for (const code of detail.permissionCodes) {
    entry(code);
    if (detail.admin.isSuperAdmin) entry(code).granted.push({ kind: "super" });
  }
  for (const row of detail.assignments) {
    if (row.expired || !row.role.isActive) continue;
    for (const code of row.role.permissions) entry(code).granted.push({ kind: "role", name: row.role.name });
  }
  for (const row of detail.overrides) {
    if (row.expired) continue;
    if (row.effect === "allow") entry(row.code).granted.push({ kind: "allow" });
    else if (!detail.admin.isSuperAdmin) entry(row.code).denied = true;
  }
  return sources;
}

export default async function AdminTeamAdminDetailPage({ params }: { params: Params }) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.adminsView)) {
    return <AdminForbidden section="مدیران" />;
  }
  const parsed = AdminParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const [detail, roles] = await Promise.all([getTeamAdminDetail(parsed.data.adminId), getRoleOptions()]);
  if (!detail) notFound();

  const { admin } = detail;
  const now = new Date();
  const canAudit = can(session.viewer.access, ADMIN_PERMISSIONS.auditLogsView);
  const activeSessions = detail.sessions.filter((row) => row.isActive).length;
  const effectiveCount = admin.isSuperAdmin ? detail.permissionCodes.length : detail.access.permissions.length;

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        items={[{ label: "مدیران و دسترسی‌ها" }, { href: "/admins/team/admins", label: "مدیران" }, { label: admin.name }]}
      />
      <div className="grid gap-5">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar image={admin.image} name={admin.name} seed={admin.id} size={60} />
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
                  {admin.name}
                  {admin.isSuperAdmin ? (
                    <Badge dot={false} tone="wheat">
                      <Crown className="size-3" />
                      مدیر ارشد
                    </Badge>
                  ) : null}
                  <AdminStatusBadge admin={admin} />
                  {admin.id === session.viewer.id ? <Badge tone="info">حساب شما</Badge> : null}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  <PhoneText phone={admin.phone} />
                  {admin.email ? <Ltr>{admin.email}</Ltr> : null}
                  <span className="inline-flex items-center gap-1">
                    <Ltr className="font-mono text-[11.5px]">{admin.id}</Ltr>
                    <CopyButton label="کپی شناسه" value={admin.id} />
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminDetailActions
                activeSessions={activeSessions}
                admin={{ email: admin.email, id: admin.id, isSuperAdmin: admin.isSuperAdmin, name: admin.name, phone: admin.phone }}
                isActive={admin.isActive}
                locked={Boolean(admin.lockedUntil) || admin.failedLoginAttempts > 0}
              />
            </div>
          </div>
          <DescriptionList
            className="mt-5 border-t border-line pt-5 sm:grid-cols-4"
            items={[
              {
                label: "آخرین ورود",
                value: admin.lastLoginAt ? (
                  <>
                    {formatDateTime(admin.lastLoginAt)}
                    {admin.lastLoginIp ? (
                      <span className="block text-[11.5px] text-muted-foreground">
                        از <Ltr>{admin.lastLoginIp}</Ltr>
                      </span>
                    ) : null}
                  </>
                ) : (
                  "هرگز وارد نشده"
                ),
              },
              { label: "آخرین تغییر رمز", value: admin.passwordChangedAt ? formatDateTime(admin.passwordChangedAt) : "ثبت نشده" },
              {
                label: "تلاش ناموفق ورود",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    {faNumber(admin.failedLoginAttempts)}
                    {admin.lockedUntil ? <Lock className="size-3.5 text-warn" /> : null}
                  </span>
                ),
              },
              {
                label: "ساخته شده",
                value: (
                  <>
                    {formatDateTime(admin.createdAt)}
                    {admin.createdBy ? <span className="block text-[11.5px] text-muted-foreground">توسط {admin.createdBy.name}</span> : null}
                  </>
                ),
              },
            ]}
          />
        </Panel>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <RolesPanel detail={detail} roles={roles} />
          <OverridesPanel detail={detail} />
        </div>

        <Panel className="pb-5">
          <PanelHeader
            description={
              admin.isSuperAdmin
                ? "مدیر ارشد به همه بخش‌ها دسترسی کامل دارد."
                : `${faNumber(effectiveCount)} از ${faNumber(detail.permissionCodes.length)} دسترسی؛ حاصل نقش‌ها و استثناهای فعال.`
            }
            title="دسترسی‌های مؤثر"
          />
          <div className="px-5">
            <EffectivePermissions codes={detail.permissionCodes} sources={permissionSources(detail)} />
          </div>
        </Panel>

        <AdminSessionsPanel
          adminId={admin.id}
          isSelf={admin.id === session.viewer.id}
          isSuperAdmin={admin.isSuperAdmin}
          now={now.toISOString()}
          sessions={detail.sessions}
        />

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Panel className="overflow-hidden">
            <PanelHeader description="آخرین کارهایی که این مدیر در پنل انجام داده است." title="فعالیت‌های این مدیر" />
            <div className="border-t border-line">
              <AuditTimeline emptyTitle="هنوز فعالیتی ثبت نشده" entries={detail.activity} linkEntries={canAudit} now={now} showActor={false} />
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <PanelHeader description="تغییراتی که مدیران دیگر روی این حساب داده‌اند." title="تاریخچه این حساب" />
            <div className="border-t border-line">
              <AuditTimeline emptyTitle="تغییری ثبت نشده" entries={detail.changes} linkEntries={canAudit} now={now} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
