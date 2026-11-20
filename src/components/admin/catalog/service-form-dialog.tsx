"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import type { AdminServiceItem } from "@/server/modules/admin/catalog/catalog-admin.service";

import { type ImageChange, ImageField, NO_IMAGE_CHANGE, toLatinDigits } from "./image-field";
import { applyImageChange } from "./save-with-image";

export type CategoryOption = { id: string; isActive: boolean; name: string };

export type ServiceDialogMode = { categoryId?: string; kind: "create" } | { kind: "edit"; service: AdminServiceItem };

export function ServiceFormDialog({
  categories,
  mode,
  onOpenChange,
}: {
  categories: CategoryOption[];
  mode: ServiceDialogMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = mode?.kind === "edit";
  return (
    <Dialog onOpenChange={onOpenChange} open={mode !== null}>
      <DialogContent
        description={
          editing
            ? "تغییر نام، تصویر یا وضعیت، بلافاصله در اپلیکیشن خدمات‌گیرندگان و خدمات‌دهندگان دیده می‌شود."
            : "خدمت جدید پس از ذخیره در جستجوی خدمات‌گیرنده و فهرست انتخاب خدمات‌دهندگان قرار می‌گیرد."
        }
        size="lg"
        title={editing ? "ویرایش خدمت" : "افزودن خدمت"}
      >
        {mode ? (
          <ServiceForm
            categories={categories}
            key={mode.kind === "edit" ? mode.service.id : "create"}
            mode={mode}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({
  categories,
  mode,
  onDone,
}: {
  categories: CategoryOption[];
  mode: ServiceDialogMode;
  onDone: () => void;
}) {
  const service = mode.kind === "edit" ? mode.service : null;
  const [name, setName] = useState(service?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    service?.category.id ?? (mode.kind === "create" ? mode.categoryId : undefined) ?? categories[0]?.id ?? "",
  );
  const [description, setDescription] = useState(service?.description ?? "");
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(service ? String(service.sortOrder) : "");
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE);
  const [advanced, setAdvanced] = useState(false);
  const action = useAdminAction();

  const slugChanged = service !== null && slug.trim() !== service.slug;
  const usedByOthers = service !== null && (service.providersCount > 0 || service.requestsCount > 0);
  const selectedCategory = categories.find((category) => category.id === categoryId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = {
      categoryId,
      description: description.trim() || null,
      isActive,
      name,
      ...(sortOrder.trim() !== "" ? { sortOrder: Number(sortOrder) } : {}),
    };
    const ok = await action.run(async () => {
      let id: string;
      if (service) {
        await adminApi.patch(`/catalog/services/${service.id}`, { ...body, slug: slug.trim() });
        id = service.id;
      } else {
        id = (await adminApi.post<{ id: string }>("/catalog/services", { ...body, slug: slug.trim() })).id;
      }
      await applyImageChange(`/catalog/services/${id}`, image);
    }, service ? "تغییرات خدمت ذخیره شد." : "خدمت جدید اضافه شد.");
    if (ok) onDone();
  }

  // Server field errors for the advanced fields should not hide behind the fold.
  const advancedOpen = advanced || Boolean(action.errors.slug || action.errors.sortOrder);

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <ImageField
          current={service?.image ?? null}
          error={action.errors.image}
          hint="تصویری که خدمت را نشان می‌دهد، مثلاً دستگاه کاشت گندم. در اپلیکیشن کنار نام خدمت به‌صورت کوچک نمایش داده می‌شود. JPEG، PNG یا WebP تا ۵ مگابایت؛ تصویر مربعی بهترین نتیجه را دارد."
          label="تصویر خدمت"
          onChange={setImage}
          value={image}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={action.errors.name} htmlFor="service-name" label="نام خدمت">
            <Input
              aria-invalid={Boolean(action.errors.name)}
              autoFocus={!service}
              id="service-name"
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً کاشت گندم"
              value={name}
            />
          </Field>
          <Field
            error={action.errors.categoryId}
            hint={selectedCategory && !selectedCategory.isActive ? "این دسته غیرفعال است؛ خدمت در اپلیکیشن دیده نمی‌شود." : undefined}
            htmlFor="service-category"
            label="دسته‌بندی"
          >
            <NativeSelect
              aria-invalid={Boolean(action.errors.categoryId)}
              id="service-category"
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              {categories.length === 0 ? <option value="">ابتدا یک دسته‌بندی بسازید</option> : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (غیرفعال)"}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field
          error={action.errors.description}
          hint="اختیاری؛ حداکثر ۱۰۰۰ نویسه."
          htmlFor="service-description"
          label="توضیحات"
        >
          <Textarea
            aria-invalid={Boolean(action.errors.description)}
            id="service-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="کاری که در این خدمت انجام می‌شود، تجهیزات یا نکات مهم"
            rows={3}
            value={description}
          />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
          <div className="min-w-0">
            <label className="text-[13px] font-semibold" htmlFor="service-active">
              فعال در اپلیکیشن
            </label>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {isActive
                ? "خدمت در جستجو و پروفایل خدمات‌دهندگان نمایش داده می‌شود."
                : "خدمت پنهان می‌شود؛ درخواست‌ها و سوابق قبلی حفظ می‌شوند."}
            </p>
          </div>
          <Switch checked={isActive} id="service-active" onCheckedChange={setIsActive} />
        </div>

        <div className="rounded-xl border border-line">
          <button
            aria-expanded={advancedOpen}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setAdvanced(!advancedOpen)}
            type="button"
          >
            تنظیمات پیشرفته
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", advancedOpen && "rotate-180")} />
          </button>
          {advancedOpen ? (
            <div className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
              <Field
                error={action.errors.slug}
                hint={
                  slugChanged && usedByOthers
                    ? "با تغییر شناسه، پیوندهای ذخیره‌شده قبلی به این خدمت دیگر کار نمی‌کنند."
                    : service
                      ? "شناسه‌ای که اپلیکیشن با آن به این خدمت ارجاع می‌دهد."
                      : "خالی بگذارید تا خودکار ساخته شود."
                }
                htmlFor="service-slug"
                label="شناسه لاتین (slug)"
              >
                <Input
                  aria-invalid={Boolean(action.errors.slug)}
                  className="text-left font-mono text-[12.5px]"
                  dir="ltr"
                  id="service-slug"
                  maxLength={120}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="wheat-planting"
                  value={slug}
                />
              </Field>
              <Field
                error={action.errors.sortOrder}
                hint="عدد کوچک‌تر بالاتر نمایش داده می‌شود. خالی: انتهای دسته."
                htmlFor="service-order"
                label="ترتیب نمایش"
              >
                <Input
                  aria-invalid={Boolean(action.errors.sortOrder)}
                  className="text-left"
                  dir="ltr"
                  id="service-order"
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => setSortOrder(toLatinDigits(event.target.value))}
                  value={sortOrder}
                />
              </Field>
            </div>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button disabled={categories.length === 0} loading={action.pending} type="submit">
          {service ? "ذخیره تغییرات" : "افزودن خدمت"}
        </Button>
      </DialogFooter>
    </form>
  );
}
