import type { Metadata } from "next";

import { ExplorerFilterBar, NotificationsList } from "@/components/admin/notifications/explorer";
import { NotificationSectionTabs } from "@/components/admin/notifications/section-tabs";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { NotificationsQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { countStoppedDeliveries, listNotifications } from "@/server/modules/admin/notifications/notifications-admin.service";

export const metadata: Metadata = { title: "همه اعلان‌ها" };

export default async function AdminAllNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.notificationsView)) {
    return <AdminForbidden section="اعلان‌ها" />;
  }
  const raw = await searchParams;
  const query = NotificationsQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const [list, stopped] = await Promise.all([listNotifications(query), countStoppedDeliveries()]);
  const filtered = Boolean(query.q || query.type || query.period !== "all" || query.read !== "all" || query.recipient !== "all");

  return (
    <UsersListFrame>
      <PageHeader
        description="همه اعلان‌هایی که سامانه یا مدیران برای کاربران ثبت کرده‌اند؛ برای پاسخ به پرسش «چرا این پیام را گرفتم؟»."
        title="اعلان‌ها"
      />
      <NotificationSectionTabs current="all" problems={stopped} />
      <Panel className="overflow-hidden">
        <div className="border-b border-line p-4">
          <ExplorerFilterBar
            query={{ period: query.period, q: query.q, read: query.read, recipient: query.recipient, type: query.type }}
            types={list.types}
          />
        </div>
        <PendingArea>
          <NotificationsList filtered={filtered} items={list.items} now={new Date()} />
          {list.total > 0 ? (
            <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
          ) : null}
        </PendingArea>
      </Panel>
    </UsersListFrame>
  );
}
