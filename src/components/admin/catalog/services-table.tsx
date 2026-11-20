"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ListChecks,
  MoreHorizontal,
  Pencil,
  SearchX,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { EmptyState } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import type { AdminServiceItem } from "@/server/modules/admin/catalog/catalog-admin.service";

import { CatalogThumb } from "./catalog-thumb";
import { type CategoryOption, type ServiceDialogMode, ServiceFormDialog } from "./service-form-dialog";

export function CatalogStatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "فعال" : "غیرفعال"}</Badge>;
}

export function ServicesTable({
  categories,
  filtered,
  items,
  reorderCategoryId,
}: {
  categories: CategoryOption[];
  filtered: boolean;
  items: AdminServiceItem[];
  /** Set when the list shows one whole category in display order, so rows can be moved. */
  reorderCategoryId?: string;
}) {
  const canManage = useCan(ADMIN_PERMISSIONS.catalogManage);
  const [dialog, setDialog] = useState<ServiceDialogMode | null>(null);
  const [deleting, setDeleting] = useState<AdminServiceItem | null>(null);
  const mutation = useAdminAction();
  const reorder = useAdminAction();

  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلترها را تغییر دهید." icon={<SearchX />} title="خدمتی با این مشخصات پیدا نشد" />
    ) : (
      <EmptyState
        description="با «افزودن خدمت» اولین خدمت را بسازید تا در اپلیکیشن قابل انتخاب شود."
        icon={<ListChecks />}
        title="هنوز خدمتی تعریف نشده است"
      />
    );
  }

  async function toggle(service: AdminServiceItem) {
    await mutation.run(
      () => adminApi.patch(`/catalog/services/${service.id}`, { isActive: !service.isActive }),
      service.isActive ? `«${service.name}» غیرفعال شد.` : `«${service.name}» فعال شد.`,
    );
  }

  async function move(index: number, direction: -1 | 1) {
    if (!reorderCategoryId) return;
    const ids = items.map((item) => item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder.run(
      () => adminApi.post("/catalog/services/reorder", { categoryId: reorderCategoryId, ids }),
      "ترتیب خدمات به‌روز شد.",
    );
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await mutation.run(() => adminApi.delete(`/catalog/services/${deleting.id}`), `«${deleting.name}» حذف شد.`);
    if (ok) setDeleting(null);
  }

  const rowActions = (service: AdminServiceItem) =>
    canManage ? (
      <div className="flex items-center justify-end gap-1">
        <Tooltip content="ویرایش">
          <Button aria-label={`ویرایش ${service.name}`} onClick={() => setDialog({ kind: "edit", service })} size="icon-sm" variant="ghost">
            <Pencil />
          </Button>
        </Tooltip>
        <Menu>
          <MenuTrigger asChild>
            <Button aria-label={`کارهای بیشتر برای ${service.name}`} size="icon-sm" variant="ghost">
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setDialog({ kind: "edit", service })}>
              <Pencil />
              ویرایش و تصویر
            </MenuItem>
            <MenuItem disabled={mutation.pending} onSelect={() => void toggle(service)}>
              {service.isActive ? <EyeOff /> : <Eye />}
              {service.isActive ? "غیرفعال کردن" : "فعال کردن"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => setDeleting(service)} tone="danger">
              <Trash2 />
              حذف خدمت
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    ) : null;

  const orderCell = (service: AdminServiceItem, index: number) =>
    reorderCategoryId && canManage ? (
      <div className="flex items-center gap-0.5">
        <Button
          aria-label={`بالا بردن ${service.name}`}
          disabled={index === 0 || reorder.pending}
          onClick={() => void move(index, -1)}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowUp />
        </Button>
        <Button
          aria-label={`پایین بردن ${service.name}`}
          disabled={index === items.length - 1 || reorder.pending}
          onClick={() => void move(index, 1)}
          size="icon-sm"
          variant="ghost"
        >
          <ArrowDown />
        </Button>
      </div>
    ) : (
      <span className="text-muted-foreground tabular-nums">{faNumber(service.sortOrder)}</span>
    );

  const deleteBlocked = deleting ? deleting.providersCount > 0 || deleting.requestsCount > 0 : false;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">خدمت</th>
              <th className="px-3 font-semibold" scope="col">دسته‌بندی</th>
              <th className="px-3 font-semibold" scope="col">خدمات‌دهنده فعال</th>
              <th className="px-3 font-semibold" scope="col">درخواست‌ها</th>
              <th className="px-3 font-semibold" scope="col">ترتیب</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-24 pl-4" scope="col">
                <span className="sr-only">کارها</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((service, index) => (
              <tr className="border-b border-line last:border-0 hover:bg-raised/70" key={service.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CatalogThumb image={service.image} name={service.name} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{service.name}</p>
                      <p className="truncate font-mono text-[11.5px] text-muted-foreground" dir="ltr">
                        {service.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{service.category.name}</span>
                    {service.category.isActive ? null : (
                      <Tooltip content="دسته غیرفعال است؛ این خدمت در اپلیکیشن دیده نمی‌شود.">
                        <span tabIndex={0}>
                          <Badge dot={false} tone="warning">دسته غیرفعال</Badge>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </td>
                <td className="px-3 tabular-nums">{faNumber(service.providersCount)}</td>
                <td className="px-3 tabular-nums">{faNumber(service.requestsCount)}</td>
                <td className="px-3">{orderCell(service, index)}</td>
                <td className="px-3">
                  <CatalogStatusBadge active={service.isActive} />
                </td>
                <td className="pl-4">{rowActions(service)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((service, index) => (
          <li className="flex items-start gap-3 px-4 py-3" key={service.id}>
            <CatalogThumb image={service.image} name={service.name} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{service.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{service.category.name}</p>
                </div>
                {rowActions(service)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                <CatalogStatusBadge active={service.isActive} />
                <span>{faNumber(service.providersCount)} خدمات‌دهنده</span>
                <span>{faNumber(service.requestsCount)} درخواست</span>
                {reorderCategoryId ? orderCell(service, index) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ServiceFormDialog categories={categories} mode={dialog} onOpenChange={(open) => !open && setDialog(null)} />

      <ConfirmDialog
        confirm={deleteBlocked ? (deleting?.isActive ? "غیرفعال کردن به جای حذف" : "از قبل غیرفعال است") : "حذف خدمت"}
        description={
          deleteBlocked
            ? `«${deleting?.name}» در ${faNumber(deleting?.providersCount ?? 0)} پروفایل خدمات‌دهنده و ${faNumber(deleting?.requestsCount ?? 0)} درخواست استفاده شده است. برای حفظ سوابق، حذف ممکن نیست؛ می‌توانید آن را غیرفعال کنید.`
            : `«${deleting?.name}» و تصویرش برای همیشه حذف می‌شود. این کار بازگشت‌پذیر نیست.`
        }
        disabled={deleteBlocked && deleting?.isActive === false}
        onConfirm={() => {
          if (!deleting) return;
          if (deleteBlocked) {
            const target = deleting;
            void toggle(target).then(() => setDeleting(null));
          } else {
            void confirmDelete();
          }
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={mutation.pending}
        title={deleteBlocked ? "این خدمت قابل حذف نیست" : "حذف خدمت"}
        tone={deleteBlocked ? "primary" : "danger"}
      />
    </>
  );
}
