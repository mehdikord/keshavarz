import type { Metadata } from "next";

import { SUBSCRIPTION_TABS } from "@/components/admin/billing/billing-labels";
import { GrantSubscriptionButton } from "@/components/admin/billing/grant-subscription-dialog";
import { SubscriptionsFilterBar } from "@/components/admin/billing/subscriptions-filter-bar";
import { SubscriptionsTable } from "@/components/admin/billing/subscriptions-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { SubscriptionsListQuerySchema } from "@/server/modules/admin/billing/billing.schemas";
import { listAdminSubscriptions } from "@/server/modules/admin/billing/billing.service";

export const metadata: Metadata = { title: "اشتراک‌ها" };

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.subscriptionsView)) {
    return <AdminForbidden section="اشتراک‌ها" />;
  }

  const raw = await searchParams;
  const query = SubscriptionsListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminSubscriptions(query);
  const filtered = Boolean(query.q || query.plan || query.source !== "all" || query.status !== "all");

  return (
    <UsersListFrame>
      <PageHeader
        actions={<GrantSubscriptionButton plans={list.plans} />}
        breadcrumbs={[{ label: "اشتراک و پرداخت" }, { label: "اشتراک‌ها" }]}
        description={`${faNumber(list.counts.active)} اشتراک فعال. خدمات‌دهنده فقط با اشتراک فعال در نتایج جستجوی خدمات‌گیرندگان دیده می‌شود.`}
        title="اشتراک‌ها"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت اشتراک" tabs={SUBSCRIPTION_TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <SubscriptionsFilterBar plans={list.plans} query={{ plan: query.plan, q: query.q, source: query.source }} />
          </div>
          <PendingArea>
            <SubscriptionsTable filtered={filtered} items={list.items} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
