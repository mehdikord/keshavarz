import type { Metadata } from "next";

import { AddCategoryButton } from "@/components/admin/catalog/add-buttons";
import { CategoriesSearch } from "@/components/admin/catalog/categories-search";
import { CategoriesTable } from "@/components/admin/catalog/categories-table";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { PendingArea, StatusTabs, UsersListFrame } from "@/components/admin/users/users-list-controls";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { CategoriesListQuerySchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { listAdminCategories } from "@/server/modules/admin/catalog/catalog-admin.service";

export const metadata: Metadata = { title: "دسته‌بندی خدمات" };

const STATUS_TABS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
] as const;

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.catalogView)) {
    return <AdminForbidden section="مدیریت خدمات" />;
  }

  const raw = await searchParams;
  const query = CategoriesListQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const list = await listAdminCategories(query);
  const filtered = Boolean(query.q || query.status !== "all");

  return (
    <UsersListFrame>
      <PageHeader
        actions={<AddCategoryButton />}
        breadcrumbs={[{ label: "مدیریت خدمات" }, { label: "دسته‌بندی خدمات" }]}
        description={`${faNumber(list.counts.all)} دسته‌بندی. خدمت‌گیرنده ابتدا دسته و سپس خدمت را انتخاب می‌کند؛ ترتیب این فهرست همان ترتیب نمایش در اپلیکیشن است.`}
        title="دسته‌بندی خدمات"
      />
      <div className="grid gap-4">
        <StatusTabs counts={list.counts} current={query.status} label="وضعیت دسته" tabs={STATUS_TABS} />
        <Panel className="overflow-hidden">
          <div className="border-b border-line p-4">
            <CategoriesSearch initial={query.q} />
          </div>
          <PendingArea>
            <CategoriesTable filtered={filtered} items={list.items} reorderable={!filtered} />
          </PendingArea>
        </Panel>
      </div>
    </UsersListFrame>
  );
}
