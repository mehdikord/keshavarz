import type { Metadata } from "next";

import { PROVIDER_TAB_LABELS } from "@/components/admin/providers/labels";
import { ProvidersFilterBar } from "@/components/admin/providers/providers-filter-bar";
import { ProvidersTable } from "@/components/admin/providers/providers-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { ProvidersListQuerySchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { listAdminProviders } from "@/server/modules/admin/providers/providers-admin.service";

export const metadata: Metadata = { title: "خدمات‌دهندگان" };

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.providersView)) {
    return <AdminForbidden section="خدمات‌دهندگان" />;
  }

  const raw = await searchParams;
  const query = ProvidersListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminProviders(query);
  const filtered = Boolean(query.q || query.province || query.service);

  return (
    <UsersListFrame>
      <PageHeader
        description={
          filtered
            ? `${faNumber(list.counts.any)} خدمات‌دهنده با این فیلترها پیدا شد.`
            : `${faNumber(list.counts.active)} خدمات‌دهنده فعال، ${faNumber(list.counts.eligible)} نفر در جستجوی کشاورزان دیده می‌شوند. خدمات، قیمت‌ها، محدوده و موقعیت کاری هر خدمات‌دهنده از صفحه او قابل ویرایش است.`
        }
        title="خدمات‌دهندگان"
      />
      <div className="grid gap-4">
        <StatusTabs
          counts={list.counts}
          current={query.status}
          label="وضعیت خدمات‌دهنده"
          tabs={PROVIDER_TAB_LABELS}
        />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <ProvidersFilterBar
              provinces={list.provinces}
              query={{ province: query.province, q: query.q, service: query.service, sort: query.sort }}
              services={list.services}
            />
          </div>
          <PendingArea>
            <ProvidersTable filtered={filtered} items={list.items} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
