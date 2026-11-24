import type { Metadata } from "next";

import { BillingSearchInput } from "@/components/admin/billing/search-input";
import { AddNewsButton } from "@/components/admin/news/add-news-button";
import { NewsTable } from "@/components/admin/news/news-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { NewsListQuerySchema } from "@/server/modules/admin/news/news-admin.schemas";
import { listAdminNews } from "@/server/modules/admin/news/news-admin.service";

export const metadata: Metadata = { title: "اخبار" };

const STATUS_TABS = [
  { key: "all", label: "همه" },
  { key: "important", label: "مهم" },
  { key: "normal", label: "عادی" },
] as const;

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.newsView)) {
    return <AdminForbidden section="اخبار" />;
  }

  const raw = await searchParams;
  const query = NewsListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminNews(query);

  return (
    <UsersListFrame>
      <PageHeader
        actions={<AddNewsButton />}
        breadcrumbs={[{ label: "اخبار" }]}
        description="خبرهای کشاورزی از سایت‌های معتبر. سه خبر آخر در صفحه اصلی اپلیکیشن و همه خبرها در صفحه «اخبار کشاورزی» نمایش داده می‌شود."
        title="اخبار کشاورزی"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="اهمیت خبر" tabs={STATUS_TABS} />
        <Panel className="overflow-hidden">
          <div className="flex border-b border-line p-4">
            <BillingSearchInput initial={query.q} label="جستجوی خبر" placeholder="عنوان خبر یا نشانی سایت منبع" />
          </div>
          <PendingArea>
            <NewsTable filtered={Boolean(query.q || query.status !== "all" || query.page > 1)} items={list.items} />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
