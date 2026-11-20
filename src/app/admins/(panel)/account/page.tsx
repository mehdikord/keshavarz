import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { redirect } from "next/navigation";

import { OwnSessionsPanel, PasswordForm, ProfileForm } from "@/components/admin/account/account-forms";
import { PageHeader } from "@/components/admin/shell/page-header";
import { AuditTimeline } from "@/components/admin/team/audit-entries";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Ltr, PhoneText } from "@/components/admin/ui/ltr";
import { DescriptionList, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getOwnAccount } from "@/server/modules/admin/account/account.service";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";

export const metadata: Metadata = { title: "حساب من" };

export default async function AccountPage() {
  const session = await getAdminPageSession();
  if (!session) redirect("/admins/login?expired=1");
  const account = await getOwnAccount({ adminId: session.auth.internalAdminId, sessionId: session.auth.sessionId });
  const { profile } = account;
  const now = new Date();

  return (
    <>
      <PageHeader description="مشخصات، رمز عبور و دستگاه‌هایی که با آن‌ها وارد پنل شده‌اید." title="حساب من" />
      <div className="grid gap-5">
        <Panel className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar image={profile.image} name={profile.name} seed={profile.id} size={56} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                {profile.name}
                {profile.isSuperAdmin ? (
                  <Badge dot={false} tone="wheat">
                    <Crown className="size-3" />
                    مدیر ارشد
                  </Badge>
                ) : null}
                {account.roles.map((role) => (
                  <Badge dot={false} key={role.name} tone="info">
                    {role.name}
                    {role.expiresAt ? ` (تا ${formatDateTime(role.expiresAt)})` : ""}
                  </Badge>
                ))}
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                <PhoneText phone={profile.phone} />
              </p>
            </div>
          </div>
          <DescriptionList
            className="mt-5 border-t border-line pt-5 sm:grid-cols-3"
            items={[
              {
                label: "ورود فعلی",
                value: profile.lastLoginAt ? (
                  <>
                    {formatDateTime(profile.lastLoginAt)}
                    {profile.lastLoginIp ? (
                      <span className="block text-[11.5px] text-muted-foreground">
                        از <Ltr>{profile.lastLoginIp}</Ltr>
                      </span>
                    ) : null}
                  </>
                ) : (
                  "—"
                ),
              },
              { label: "آخرین تغییر رمز", value: profile.passwordChangedAt ? formatDateTime(profile.passwordChangedAt) : "ثبت نشده" },
              {
                label: "دسترسی‌ها",
                value: profile.isSuperAdmin ? "همه بخش‌ها" : `${faNumber(session.viewer.access.permissions.length)} دسترسی`,
              },
            ]}
          />
        </Panel>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <ProfileForm email={profile.email} name={profile.name} />
          <PasswordForm />
        </div>

        <OwnSessionsPanel now={now.toISOString()} sessions={account.sessions} />

        <Panel className="overflow-hidden">
          <PanelHeader description="آخرین کارهایی که با این حساب در پنل انجام شده است." title="فعالیت‌های من" />
          <div className="border-t border-line">
            <AuditTimeline
              emptyTitle="هنوز فعالیتی ثبت نشده"
              entries={account.activity}
              linkEntries={can(session.viewer.access, ADMIN_PERMISSIONS.auditLogsView)}
              now={now}
              showActor={false}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
