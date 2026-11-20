"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, FolderTree, ListChecks, MoreHorizontal, Pencil, SearchX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { EmptyState } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import type { AdminCategoryItem } from "@/server/modules/admin/catalog/catalog-admin.service";

import { CatalogThumb } from "./catalog-thumb";
import { CategoryFormDialog, type CategoryDialogMode } from "./category-form-dialog";
import { CatalogStatusBadge } from "./services-table";

export function CategoriesTable({
  filtered,
  items,
  reorderable,
}: {
  filtered: boolean;
  items: AdminCategoryItem[];
  /** The list shows every category in display order, so rows can be moved. */
  reorderable: boolean;
}) {
  const canManage = useCan(ADMIN_PERMISSIONS.catalogManage);
  const [dialog, setDialog] = useState<CategoryDialogMode | null>(null);
  const [deleting, setDeleting] = useState<AdminCategoryItem | null>(null);
  const [deactivating, setDeactivating] = useState<AdminCategoryItem | null>(null);
  const mutation = useAdminAction();
  const reorder = useAdminAction();

  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلتر وضعیت را تغییر دهید." icon={<SearchX />} title="دسته‌ای پیدا نشد" />
    ) : (
      <EmptyState
        description="خدمات در دسته‌ها گروه‌بندی می‌شوند؛ مثلاً «کاشت»، «برداشت» یا «سمپاشی». با «افزودن دسته‌بندی» شروع کنید."
        icon={<FolderTree />}
        title="هنوز دسته‌بندی‌ای ساخته نشده است"
      />
    );
  }

  async function setActive(category: AdminCategoryItem, isActive: boolean) {
    return mutation.run(
      () => adminApi.patch(`/catalog/categories/${category.id}`, { isActive }),
      isActive ? `«${category.name}» فعال شد.` : `«${category.name}» غیرفعال شد.`,
    );
  }

  async function move(index: number, direction: -1 | 1) {
    const ids = items.map((item) => item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder.run(() => adminApi.post("/catalog/categories/reorder", { ids }), "ترتیب دسته‌ها به‌روز شد.");
  }

  const servicesHref = (category: AdminCategoryItem) => `/admins/catalog/services?category=${category.id}`;

  const rowActions = (category: AdminCategoryItem) => (
    <div className="flex items-center justify-end gap-1">
      {canManage ? (
        <Tooltip content="ویرایش">
          <Button aria-label={`ویرایش ${category.name}`} onClick={() => setDialog({ category, kind: "edit" })} size="icon-sm" variant="ghost">
            <Pencil />
          </Button>
        </Tooltip>
      ) : null}
      <Menu>
        <MenuTrigger asChild>
          <Button aria-label={`کارهای بیشتر برای ${category.name}`} size="icon-sm" variant="ghost">
            <MoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild>
            <Link href={servicesHref(category)}>
              <ListChecks />
              مشاهده خدمات این دسته
            </Link>
          </MenuItem>
          {canManage ? (
            <>
              <MenuItem onSelect={() => setDialog({ category, kind: "edit" })}>
                <Pencil />
                ویرایش و تصویر
              </MenuItem>
              <MenuItem
                disabled={mutation.pending}
                onSelect={() => {
                  if (!category.isActive) void setActive(category, true);
                  else if (category.activeServicesCount > 0) setDeactivating(category);
                  else void setActive(category, false);
                }}
              >
                {category.isActive ? <EyeOff /> : <Eye />}
                {category.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => setDeleting(category)} tone="danger">
                <Trash2 />
                حذف دسته‌بندی
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
    </div>
  );

  const orderCell = (category: AdminCategoryItem, index: number) =>
    reorderable && canManage ? (
      <div className="flex items-center gap-0.5">
        <Button
          aria-label={`بالا بردن ${category.name}`}
          disabled={index === 0 || reorder.pending}
          onClick={() => void move(index, -1)}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowUp />
        </Button>
        <Button
          aria-label={`پایین بردن ${category.name}`}
          disabled={index === items.length - 1 || reorder.pending}
          onClick={() => void move(index, 1)}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowDown />
        </Button>
      </div>
    ) : (
      <span className="text-muted-foreground tabular-nums">{faNumber(category.sortOrder)}</span>
    );

  const servicesCell = (category: AdminCategoryItem) => (
    <Link
      className="inline-flex items-baseline gap-1 rounded font-semibold text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      href={servicesHref(category)}
    >
      {faNumber(category.servicesCount)}
      <span className="text-[11.5px] font-normal text-muted-foreground">
        ({faNumber(category.activeServicesCount)} فعال)
      </span>
    </Link>
  );

  const deleteBlocked = (deleting?.servicesCount ?? 0) > 0;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">دسته‌بندی</th>
              <th className="px-3 font-semibold" scope="col">خدمات</th>
              <th className="px-3 font-semibold" scope="col">درخواست‌ها</th>
              <th className="px-3 font-semibold" scope="col">ترتیب</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-24 pl-4" scope="col">
                <span className="sr-only">کارها</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((category, index) => (
              <tr className="border-b border-line last:border-0 hover:bg-raised/70" key={category.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CatalogThumb image={category.image} kind="category" name={category.name} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{category.name}</p>
                      <p className="max-w-md truncate text-[11.5px] text-muted-foreground">
                        {category.description ?? (
                          <span className="font-mono" dir="ltr">
                            {category.slug}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3">{servicesCell(category)}</td>
                <td className="px-3 tabular-nums">{faNumber(category.requestsCount)}</td>
                <td className="px-3">{orderCell(category, index)}</td>
                <td className="px-3">
                  <CatalogStatusBadge active={category.isActive} />
                </td>
                <td className="pl-4">{rowActions(category)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((category, index) => (
          <li className="flex items-start gap-3 px-4 py-3" key={category.id}>
            <CatalogThumb image={category.image} kind="category" name={category.name} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate font-bold">{category.name}</p>
                {rowActions(category)}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                <CatalogStatusBadge active={category.isActive} />
                <span>{servicesCell(category)} خدمت</span>
                <span>{faNumber(category.requestsCount)} درخواست</span>
                {reorderable ? orderCell(category, index) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <CategoryFormDialog mode={dialog} onOpenChange={(open) => !open && setDialog(null)} />

      <ConfirmDialog
        confirm="غیرفعال کردن"
        description={`«${deactivating?.name}» و ${faNumber(deactivating?.activeServicesCount ?? 0)} خدمت فعال آن از فهرست انتخاب خدمات در اپلیکیشن پنهان می‌شوند. درخواست‌ها و سوابق قبلی حفظ می‌شوند.`}
        onConfirm={() => {
          if (!deactivating) return;
          void setActive(deactivating, false).then((ok) => ok && setDeactivating(null));
        }}
        onOpenChange={(open) => !open && setDeactivating(null)}
        open={deactivating !== null}
        pending={mutation.pending}
        title="غیرفعال کردن دسته‌بندی"
        tone="primary"
      />

      <ConfirmDialog
        confirm="حذف دسته‌بندی"
        description={
          deleteBlocked
            ? `«${deleting?.name}» هنوز ${faNumber(deleting?.servicesCount ?? 0)} خدمت دارد. ابتدا خدمات را به دسته دیگری منتقل یا حذف کنید، یا دسته را غیرفعال کنید.`
            : `«${deleting?.name}» برای همیشه حذف می‌شود. این کار بازگشت‌پذیر نیست.`
        }
        disabled={deleteBlocked}
        onConfirm={() => {
          if (!deleting) return;
          void mutation
            .run(() => adminApi.delete(`/catalog/categories/${deleting.id}`), `«${deleting.name}» حذف شد.`)
            .then((ok) => ok && setDeleting(null));
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={mutation.pending}
        title={deleteBlocked ? "این دسته قابل حذف نیست" : "حذف دسته‌بندی"}
      />
    </>
  );
}
