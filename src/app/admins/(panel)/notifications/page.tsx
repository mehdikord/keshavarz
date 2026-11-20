import { Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CampaignsTable } from "@/components/admin/notifications/campaigns";
import { NotificationSectionTabs } from "@/components/admin/notifications/section-tabs";
import { SimplePager } from "@/components/admin/notifications/simple-pager";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { buttonVariants } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { CampaignsQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { countStoppedDeliveries, listCampaigns } from "@/server/modules/admin/notifications/notifications-admin.service";

export const metadata: Metadata = { title: "اعلان‌ها" };

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.notificationsView)) {
    return <AdminForbidden section="اعلان‌ها" />;
  }
  const canSend = can(session.viewer.access, ADMIN_PERMISSIONS.notificationsSend);
  const raw = await searchParams;
  const { page } = CampaignsQuerySchema.parse({ page: Array.isArray(raw.page) ? raw.page[0] : raw.page });
  const [list, stopped] = await Promise.all([listCampaigns(page), countStoppedDeliveries()]);

  return (
    <>
      <PageHeader
        actions={
          canSend ? (
            <Link className={buttonVariants()} href="/admins/notifications/new">
              <Send />
              ارسال اعلان
            </Link>
          ) : null
        }
        description={`پیام به یک کاربر یا گروهی از کاربران، با آمار خوانده‌شدن. تاکنون ${faNumber(list.total)} ارسال از پنل انجام شده است.`}
        title="اعلان‌ها"
      />
      <NotificationSectionTabs current="campaigns" problems={stopped} />
      <Panel className="overflow-hidden">
        <CampaignsTable canSend={canSend} items={list.items} now={new Date()} />
        <SimplePager page={list.page} pageCount={list.pageCount} total={list.total} />
      </Panel>
    </>
  );
}
