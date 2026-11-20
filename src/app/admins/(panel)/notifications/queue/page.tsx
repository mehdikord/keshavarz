import type { Metadata } from "next";

import { DeliveriesTable, DeliveryFilters, QueueActions, QueueSummary } from "@/components/admin/notifications/queue";
import { NotificationSectionTabs } from "@/components/admin/notifications/section-tabs";
import { SimplePager } from "@/components/admin/notifications/simple-pager";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { PendingArea, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { DeliveriesQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { getDeliveryHealth } from "@/server/modules/admin/notifications/notifications-admin.service";

export const metadata: Metadata = { title: "صف تحویل اعلان‌ها" };

export default async function AdminNotificationQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.notificationsView)) {
    return <AdminForbidden section="اعلان‌ها" />;
  }
  const raw = await searchParams;
  const query = DeliveriesQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const health = await getDeliveryHealth(query);

  return (
    <UsersListFrame>
      <PageHeader
        actions={<QueueActions dead={health.summary.dead} queued={health.summary.queued} />}
        description={`هر اعلان برای هر کانال یک «تحویل» در صف دارد. تحویل ناموفق تا ${new Intl.NumberFormat("fa-IR").format(health.maxAttempts)} بار با فاصله دوباره تلاش می‌شود و بعد متوقف می‌شود.`}
        title="اعلان‌ها"
      />
      <NotificationSectionTabs current="queue" problems={health.summary.dead} />
      <div className="grid gap-4">
        <QueueSummary health={health} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <DeliveryFilters channel={query.channel} status={query.status} />
          </div>
          <PendingArea>
            <DeliveriesTable items={health.deliveries.items} now={new Date()} />
            <SimplePager page={health.deliveries.page} pageCount={health.deliveries.pageCount} total={health.deliveries.total} />
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
