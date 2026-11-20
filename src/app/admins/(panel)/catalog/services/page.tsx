import type { Metadata } from "next";

import { AddServiceButton } from "@/components/admin/catalog/add-buttons";
import { ServicesFilterBar } from "@/components/admin/catalog/services-filter-bar";
import { ServicesTable } from "@/components/admin/catalog/services-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { Pagination, PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { ServicesListQuerySchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { listAdminServices } from "@/server/modules/admin/catalog/catalog-admin.service";

export const metadata: Metadata = { title: "لیست خدمات" };

const STATUS_TABS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
] as const;

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.catalogView)) {
    return <AdminForbidden section="مدیریت خدمات" />;
  }

  const raw = await searchParams;
  const query = ServicesListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminServices(query);
  const filtered = Boolean(query.q || query.category || query.status !== "all");
  const category = list.categories.find((option) => option.id === query.category);

  // Moving rows needs the whole category on screen, in display order.
  const reorderable =
    Boolean(category) && query.sort === "order" && !query.q && query.status === "all" && list.total <= list.items.length;

  return (
    <UsersListFrame>
      <PageHeader
        actions={<AddServiceButton categories={list.categories} categoryId={category?.id} />}
        breadcrumbs={[{ label: "مدیریت خدمات" }, { label: "لیست خدمات" }]}
        description={`${faNumber(list.counts.all)} خدمت در ${faNumber(list.categories.length)} دسته. نام و تصویر هر خدمت در جستجوی خدمات‌گیرنده، درخواست‌ها و پروفایل خدمات‌دهندگان نمایش داده می‌شود.`}
        title={category ? `خدمات «${category.name}»` : "لیست خدمات"}
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت خدمت" tabs={STATUS_TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <ServicesFilterBar
              categories={list.categories}
              query={{ category: query.category, q: query.q, sort: query.sort }}
            />
            {!reorderable && query.sort === "order" && !category && list.total > 1 ? (
              <p className="mt-3 text-xs text-muted-foreground">برای جابه‌جا کردن ترتیب نمایش، یک دسته‌بندی را انتخاب کنید.</p>
            ) : null}
          </div>
          <PendingArea>
            <ServicesTable
              categories={list.categories}
              filtered={filtered}
              items={list.items}
              reorderCategoryId={reorderable ? category?.id : undefined}
            />
            {list.total > 0 ? (
              <Pagination page={query.page} pageCount={list.pageCount} perPage={query.perPage} total={list.total} />
            ) : null}
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
