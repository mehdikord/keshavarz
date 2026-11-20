"use client";

import { Eye, EyeOff, History, ListChecks, MoreHorizontal, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { CatalogThumb } from "@/components/admin/catalog/catalog-thumb";
import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/admin/ui/menu";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDate, formatToman } from "@/lib/admin/format";
import { PRICING_UNIT } from "@/lib/admin/labels";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import type {
  AdminCatalogServiceOption,
  AdminProviderService,
} from "@/server/modules/admin/providers/providers-admin.service";

import { PRICE_CHANGED_BY } from "./labels";

const UNITS = ["fixed", "per_hectare", "per_square_meter", "per_hour", "per_day"] as const;

const digitsOnly = (value: string) =>
  value.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)).replace(/\D/g, "");

type DialogMode = { kind: "add" } | { kind: "edit"; service: AdminProviderService };

export function ServicesManager({
  catalog,
  providerId,
  services,
}: {
  catalog: AdminCatalogServiceOption[];
  providerId: string;
  services: AdminProviderService[];
}) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.providersUpdate);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [deleting, setDeleting] = useState<AdminProviderService | null>(null);
  const [history, setHistory] = useState<AdminProviderService | null>(null);
  const mutation = useAdminAction();

  const active = services.filter((service) => service.isActive).length;
  const offered = new Set(services.filter((service) => service.isActive).map((service) => service.catalogServiceId));

  async function toggle(service: AdminProviderService) {
    await mutation.run(
      () => adminApi.patch(`/providers/${providerId}/services/${service.id}`, { isActive: !service.isActive }),
      service.isActive ? `«${service.name}» غیرفعال شد.` : `«${service.name}» دوباره فعال شد.`,
    );
  }

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        action={
          canUpdate ? (
            <Button onClick={() => setDialog({ kind: "add" })} size="sm">
              <Plus />
              افزودن خدمت
            </Button>
          ) : null
        }
        description={`${faNumber(active)} خدمت فعال. کشاورز فقط خدمات فعال را با همین قیمت‌ها در نتایج جستجو می‌بیند.`}
        title="خدمات قابل ارائه"
      />
      {services.length === 0 ? (
        <EmptyState
          className="border-t border-line"
          description="تا دست‌کم یک خدمت با قیمت ثبت نشود، این خدمات‌دهنده در جستجو دیده نمی‌شود."
          icon={<ListChecks />}
          title="هنوز خدمتی ثبت نشده است"
        />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {services.map((service) => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5" key={service.id}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <CatalogThumb className={service.isActive ? undefined : "opacity-55 grayscale"} image={service.image} name={service.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold">{service.name}</p>
                    {!service.isActive ? <Badge tone="neutral">غیرفعال</Badge> : null}
                    {service.isActive && !service.catalogActive ? (
                      <Tooltip content="این خدمت در کاتالوگ غیرفعال شده و در جستجو دیده نمی‌شود.">
                        <span tabIndex={0}>
                          <Badge tone="warning">
                            <TriangleAlert className="size-3" />
                            کاتالوگ غیرفعال
                          </Badge>
                        </span>
                      </Tooltip>
                    ) : null}
                  </div>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {service.category}
                    {service.description ? ` · ${service.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-extrabold tabular-nums">{formatToman(service.priceToman)}</p>
                <p className="text-[11.5px] text-muted-foreground">{PRICING_UNIT[service.pricingUnit] ?? service.pricingUnit}</p>
              </div>
              <div className="w-24 text-[11.5px] text-muted-foreground">
                {faNumber(service.requestsCount)} درخواست
                <br />
                به‌روز {formatDate(service.updatedAt)}
              </div>
              <div className="flex items-center gap-1">
                {canUpdate ? (
                  <Tooltip content="ویرایش قیمت و توضیحات">
                    <Button
                      aria-label={`ویرایش ${service.name}`}
                      onClick={() => setDialog({ kind: "edit", service })}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Pencil />
                    </Button>
                  </Tooltip>
                ) : null}
                <Menu>
                  <MenuTrigger asChild>
                    <Button aria-label={`کارهای بیشتر برای ${service.name}`} size="icon-sm" variant="ghost">
                      <MoreHorizontal />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem onSelect={() => setHistory(service)}>
                      <History />
                      تاریخچه قیمت
                    </MenuItem>
                    {canUpdate ? (
                      <>
                        <MenuItem disabled={mutation.pending} onSelect={() => void toggle(service)}>
                          {service.isActive ? <EyeOff /> : <Eye />}
                          {service.isActive ? "غیرفعال کردن" : "فعال کردن دوباره"}
                        </MenuItem>
                        <MenuSeparator />
                        <MenuItem onSelect={() => setDeleting(service)} tone="danger">
                          <Trash2 />
                          حذف از فهرست
                        </MenuItem>
                      </>
                    ) : null}
                  </MenuContent>
                </Menu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={dialog !== null}>
        <DialogContent
          description={
            dialog?.kind === "edit"
              ? "تغییر قیمت در تاریخچه قیمت این خدمت با نام شما ثبت می‌شود."
              : "خدمت از کاتالوگ فعال انتخاب می‌شود. اگر قبلاً ارائه می‌شده و غیرفعال شده، با شرایط جدید دوباره فعال می‌شود."
          }
          title={dialog?.kind === "edit" ? `ویرایش «${dialog.service.name}»` : "افزودن خدمت به خدمات‌دهنده"}
        >
          {dialog ? (
            <ServiceForm
              catalog={catalog}
              key={dialog.kind === "edit" ? dialog.service.id : "add"}
              mode={dialog}
              offered={offered}
              onDone={() => setDialog(null)}
              providerId={providerId}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setHistory(null)} open={history !== null}>
        <DialogContent size="sm" title={`تاریخچه قیمت «${history?.name ?? ""}»`}>
          <DialogBody>
            {history && history.priceHistory.length > 0 ? (
              <ol className="grid gap-3">
                {history.priceHistory.map((entry, index) => (
                  <li className="flex items-start justify-between gap-3 text-[13px]" key={`${entry.createdAt}-${index}`}>
                    <div>
                      <p className="font-semibold tabular-nums">
                        {entry.oldPriceToman === null ? "قیمت اولیه " : `${formatToman(entry.oldPriceToman)} ← `}
                        {formatToman(entry.newPriceToman)}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {PRICE_CHANGED_BY[entry.by] ?? entry.by}
                        {entry.byAdmin ? ` (${entry.byAdmin})` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13px] text-muted-foreground">تغییر قیمتی ثبت نشده است.</p>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirm={
          deleting && !deleting.canDelete
            ? deleting.isActive
              ? "غیرفعال کردن به جای حذف"
              : "از قبل غیرفعال است"
            : "حذف از فهرست"
        }
        description={
          deleting && !deleting.canDelete
            ? `«${deleting.name}» در جستجوها یا درخواست‌های کشاورزان استفاده شده است و برای حفظ سوابق حذف نمی‌شود. می‌توانید آن را غیرفعال کنید.`
            : `«${deleting?.name}» و تاریخچه قیمتش از فهرست این خدمات‌دهنده حذف می‌شود.`
        }
        disabled={Boolean(deleting && !deleting.canDelete && !deleting.isActive)}
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          const run = target.canDelete
            ? mutation.run(() => adminApi.delete(`/providers/${providerId}/services/${target.id}`), `«${target.name}» حذف شد.`)
            : mutation.run(
                () => adminApi.patch(`/providers/${providerId}/services/${target.id}`, { isActive: false }),
                `«${target.name}» غیرفعال شد.`,
              );
          void run.then((ok) => ok && setDeleting(null));
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
        open={deleting !== null}
        pending={mutation.pending}
        title={deleting && !deleting.canDelete ? "این خدمت قابل حذف نیست" : "حذف خدمت"}
        tone={deleting && !deleting.canDelete ? "primary" : "danger"}
      />
    </Panel>
  );
}

function ServiceForm({
  catalog,
  mode,
  offered,
  onDone,
  providerId,
}: {
  catalog: AdminCatalogServiceOption[];
  mode: DialogMode;
  offered: Set<string>;
  onDone: () => void;
  providerId: string;
}) {
  const editing = mode.kind === "edit" ? mode.service : null;
  const available = catalog.filter((service) => service.isActive && !offered.has(service.id));
  const [serviceId, setServiceId] = useState(editing?.catalogServiceId ?? available[0]?.id ?? "");
  const [price, setPrice] = useState(editing ? String(editing.priceToman) : "");
  const [unit, setUnit] = useState<string>(editing?.pricingUnit ?? "fixed");
  const [description, setDescription] = useState(editing?.description ?? "");
  const action = useAdminAction();

  const byCategory = new Map<string, AdminCatalogServiceOption[]>();
  for (const service of available) byCategory.set(service.category, [...(byCategory.get(service.category) ?? []), service]);
  const selected = catalog.find((service) => service.id === serviceId);
  const priceNumber = Number(price || 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = { description: description.trim() || null, priceToman: priceNumber, pricingUnit: unit };
    const ok = await action.run(
      () =>
        editing
          ? adminApi.patch(`/providers/${providerId}/services/${editing.id}`, body)
          : adminApi.post(`/providers/${providerId}/services`, { ...body, serviceId }),
      editing ? "تغییرات خدمت ذخیره شد." : "خدمت به فهرست خدمات‌دهنده اضافه شد.",
    );
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        {editing ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
            <CatalogThumb image={editing.image} name={editing.name} />
            <div>
              <p className="font-bold">{editing.name}</p>
              <p className="text-[11.5px] text-muted-foreground">{editing.category}</p>
            </div>
          </div>
        ) : (
          <Field
            error={action.errors.serviceId}
            hint={available.length === 0 ? "همه خدمات فعال کاتالوگ از قبل در فهرست این خدمات‌دهنده است." : undefined}
            htmlFor="ps-service"
            label="خدمت"
          >
            <div className="flex items-center gap-2">
              {selected ? <CatalogThumb image={selected.image} name={selected.name} size={36} /> : null}
              <NativeSelect
                aria-invalid={Boolean(action.errors.serviceId)}
                className="flex-1"
                disabled={available.length === 0}
                id="ps-service"
                onChange={(event) => setServiceId(event.target.value)}
                value={serviceId}
              >
                {[...byCategory.entries()].map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </NativeSelect>
            </div>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={action.errors.priceToman}
            hint={priceNumber >= 1000 ? formatToman(priceNumber) : "حداقل ۱٬۰۰۰ تومان"}
            htmlFor="ps-price"
            label="قیمت (تومان)"
          >
            <Input
              aria-invalid={Boolean(action.errors.priceToman)}
              autoFocus={Boolean(editing)}
              className="text-left tabular-nums"
              dir="ltr"
              id="ps-price"
              inputMode="numeric"
              onChange={(event) => setPrice(digitsOnly(event.target.value))}
              placeholder="500000"
              value={price}
            />
          </Field>
          <Field error={action.errors.pricingUnit} htmlFor="ps-unit" label="واحد قیمت">
            <NativeSelect id="ps-unit" onChange={(event) => setUnit(event.target.value)} value={unit}>
              {UNITS.map((value) => (
                <option key={value} value={value}>
                  {PRICING_UNIT[value]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field error={action.errors.description} hint="اختیاری؛ مثلاً نوع دستگاه یا شرایط انجام کار." htmlFor="ps-desc" label="توضیحات">
          <Textarea
            aria-invalid={Boolean(action.errors.description)}
            id="ps-desc"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            value={description}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button disabled={!editing && available.length === 0} loading={action.pending} type="submit">
          {editing ? "ذخیره تغییرات" : "افزودن خدمت"}
        </Button>
      </DialogFooter>
    </form>
  );
}
