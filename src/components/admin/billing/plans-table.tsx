"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, MoreHorizontal, Package, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { EmptyState } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatToman } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import type { AdminPlanItem } from "@/server/modules/admin/billing/billing.service";

import { type PlanDialogMode, PlanFormDialog } from "./plan-form-dialog";

export function PlansTable({ items }: { items: AdminPlanItem[] }) {
  const canManage = useCan(ADMIN_PERMISSIONS.subscriptionsManage);
  const [dialog, setDialog] = useState<PlanDialogMode | null>(null);
  const [deleting, setDeleting] = useState<AdminPlanItem | null>(null);
  const mutation = useAdminAction();
  const reorder = useAdminAction();

  if (items.length === 0) {
    return (
      <EmptyState
        description="خدمات‌دهندگان برای نمایش در جستجو به اشتراک نیاز دارند. با «افزودن پلن» اولین پلن را بسازید."
        icon={<Package />}
        title="هنوز پلنی تعریف نشده است"
      />
    );
  }

  async function move(index: number, direction: -1 | 1) {
    const ids = items.map((item) => item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder.run(() => adminApi.post("/billing/plans/reorder", { ids }), "ترتیب پلن‌ها به‌روز شد.");
  }

  const blocked = (deleting?.activeCount ?? 0) > 0;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">پلن</th>
              <th className="px-3 font-semibold" scope="col">مدت</th>
              <th className="px-3 font-semibold" scope="col">قیمت</th>
              <th className="px-3 font-semibold" scope="col">اشتراک فعال</th>
              <th className="px-3 font-semibold" scope="col">درآمد خالص</th>
              <th className="px-3 font-semibold" scope="col">ترتیب</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-24 pl-4" scope="col">
                <span className="sr-only">کارها</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((plan, index) => (
              <tr className="border-b border-line last:border-0 hover:bg-raised/70" key={plan.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{plan.name}</span>
                    {plan.isRecommended ? (
                      <Badge dot={false} tone="wheat">
                        <Sparkles className="size-3" />
                        پیشنهادی
                      </Badge>
                    ) : null}
                  </div>
                  <p className="font-mono text-[11.5px] text-muted-foreground" dir="ltr">
                    {plan.code}
                  </p>
                  {plan.features.length ? (
                    <p className="mt-0.5 max-w-sm truncate text-[11.5px] text-muted-foreground">{plan.features.join(" · ")}</p>
                  ) : null}
                </td>
                <td className="px-3 whitespace-nowrap">{faNumber(plan.durationMonths)} ماه</td>
                <td className="px-3 whitespace-nowrap tabular-nums">{formatToman(plan.priceToman)}</td>
                <td className="px-3 tabular-nums">
                  {faNumber(plan.activeCount)}
                  <span className="text-[11.5px] text-muted-foreground"> از {faNumber(plan.totalCount)}</span>
                </td>
                <td className="px-3 whitespace-nowrap tabular-nums">{formatToman(plan.netRevenueToman)}</td>
                <td className="px-3">
                  {canManage ? (
                    <div className="flex items-center gap-0.5">
                      <Button
                        aria-label={`بالا بردن ${plan.name}`}
                        disabled={index === 0 || reorder.pending}
                        onClick={() => void move(index, -1)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        aria-label={`پایین بردن ${plan.name}`}
                        disabled={index === items.length - 1 || reorder.pending}
                        onClick={() => void move(index, 1)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  ) : (
                    faNumber(plan.sortOrder)
                  )}
                </td>
                <td className="px-3">
                  <Badge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "قابل خرید" : "غیرفعال"}</Badge>
                </td>
                <td className="pl-4">
                  {canManage ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button aria-label={`ویرایش ${plan.name}`} onClick={() => setDialog({ kind: "edit", plan })} size="icon-sm" variant="ghost">
                        <Pencil />
                      </Button>
                      <Menu>
                        <MenuTrigger asChild>
                          <Button aria-label={`کارهای بیشتر برای ${plan.name}`} size="icon-sm" variant="ghost">
                            <MoreHorizontal />
                          </Button>
                        </MenuTrigger>
                        <MenuContent>
                          <MenuItem
                            disabled={mutation.pending}
                            onSelect={() =>
                              void mutation.run(
                                () => adminApi.patch(`/billing/plans/${plan.id}`, { isActive: !plan.isActive }),
                                plan.isActive ? `«${plan.name}» از فروش خارج شد.` : `«${plan.name}» قابل خرید شد.`,
                              )
                            }
                          >
                            {plan.isActive ? <EyeOff /> : <Eye />}
                            {plan.isActive ? "توقف فروش" : "فعال کردن فروش"}
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem onSelect={() => setDeleting(plan)} tone="danger">
                            <Trash2 />
                            حذف پلن
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlanFormDialog mode={dialog} onOpenChange={(open) => !open && setDialog(null)} />
      <ConfirmDialog
        confirm="حذف پلن"
        description={
          blocked
            ? `«${deleting?.name}» ${faNumber(deleting?.activeCount ?? 0)} اشتراک فعال دارد و قابل حذف نیست. با «توقف فروش» آن را از صفحه خرید خارج کنید.`
            : `«${deleting?.name}» از فهرست پلن‌ها حذف می‌شود. سوابق اشتراک‌ها و پرداخت‌های قبلی آن حفظ می‌شود.`
        }
        disabled={blocked}
        onConfirm={() => {
          if (!deleting) return;
          void mutation
            .run(() => adminApi.delete(`/billing/plans/${deleting.id}`), `«${deleting.name}» حذف شد.`)
            .then((ok) => ok && setDeleting(null));
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={mutation.pending}
        title={blocked ? "این پلن قابل حذف نیست" : "حذف پلن"}
      />
    </>
  );
}
