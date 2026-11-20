import type { Metadata } from "next";

import { ComposeForm } from "@/components/admin/notifications/compose-form";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { getComposeOptions, getRecipient } from "@/server/modules/admin/notifications/notifications-admin.service";

export const metadata: Metadata = { title: "ارسال اعلان" };

export default async function AdminComposeNotificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.notificationsSend)) {
    return <AdminForbidden section="ارسال اعلان" />;
  }
  const raw = await searchParams;
  const userParam = Array.isArray(raw.user) ? raw.user[0] : raw.user;
  const [options, initialUser] = await Promise.all([getComposeOptions(), userParam ? getRecipient(userParam) : null]);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ href: "/admins/notifications", label: "اعلان‌ها" }, { label: "ارسال اعلان" }]}
        description="گیرندگان را انتخاب کنید، متن را بنویسید و پیش از ارسال تعداد دقیق گیرندگان را ببینید."
        title="ارسال اعلان"
      />
      <ComposeForm initialUser={initialUser} provinces={options.provinces} />
    </>
  );
}
