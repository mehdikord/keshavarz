"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import type { AdminCategoryItem } from "@/server/modules/admin/catalog/catalog-admin.service";

import { type ImageChange, ImageField, NO_IMAGE_CHANGE, toLatinDigits } from "./image-field";
import { applyImageChange } from "./save-with-image";

export type CategoryDialogMode = { kind: "create" } | { category: AdminCategoryItem; kind: "edit" };

export function CategoryFormDialog({
  mode,
  onOpenChange,
}: {
  mode: CategoryDialogMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = mode?.kind === "edit";
  return (
    <Dialog onOpenChange={onOpenChange} open={mode !== null}>
      <DialogContent
        description={
          editing
            ? "تغییرات بلافاصله در اپلیکیشن اعمال می‌شود."
            : "پس از ساخت دسته، از «لیست خدمات» خدمت‌های آن را اضافه کنید."
        }
        size="lg"
        title={editing ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"}
      >
        {mode ? (
          <CategoryForm
            key={mode.kind === "edit" ? mode.category.id : "create"}
            mode={mode}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ mode, onDone }: { mode: CategoryDialogMode; onDone: () => void }) {
  const category = mode.kind === "edit" ? mode.category : null;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "");
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE);
  const [advanced, setAdvanced] = useState(false);
  const action = useAdminAction();

  const advancedOpen = advanced || Boolean(action.errors.slug || action.errors.sortOrder);
  const deactivating = category?.isActive === true && !isActive && category.activeServicesCount > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = {
      description: description.trim() || null,
      isActive,
      name,
      slug: slug.trim(),
      ...(sortOrder.trim() !== "" ? { sortOrder: Number(sortOrder) } : {}),
    };
    const ok = await action.run(async () => {
      let id: string;
      if (category) {
        await adminApi.patch(`/catalog/categories/${category.id}`, body);
        id = category.id;
      } else {
        id = (await adminApi.post<{ id: string }>("/catalog/categories", body)).id;
      }
      await applyImageChange(`/catalog/categories/${id}`, image);
    }, category ? "تغییرات دسته‌بندی ذخیره شد." : "دسته‌بندی جدید اضافه شد.");
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <ImageField
          current={category?.image ?? null}
          error={action.errors.image}
          hint="تصویر شاخص دسته (اختیاری). JPEG، PNG یا WebP تا ۵ مگابایت."
          label="تصویر دسته"
          onChange={setImage}
          value={image}
        />
        <Field error={action.errors.name} htmlFor="category-name" label="نام دسته‌بندی">
          <Input
            aria-invalid={Boolean(action.errors.name)}
            autoFocus={!category}
            id="category-name"
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً کاشت"
            value={name}
          />
        </Field>
        <Field error={action.errors.description} hint="اختیاری؛ حداکثر ۱۰۰۰ نویسه." htmlFor="category-description" label="توضیحات">
          <Textarea
            aria-invalid={Boolean(action.errors.description)}
            id="category-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            value={description}
          />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
          <div className="min-w-0">
            <label className="text-[13px] font-semibold" htmlFor="category-active">
              فعال در اپلیکیشن
            </label>
            <p className={cn("mt-0.5 text-xs leading-5", deactivating ? "text-warn" : "text-muted-foreground")}>
              {deactivating
                ? "با غیرفعال کردن، این دسته و همه خدماتش در اپلیکیشن از فهرست انتخاب پنهان می‌شوند."
                : isActive
                  ? "دسته و خدمات فعالش در اپلیکیشن نمایش داده می‌شوند."
                  : "دسته در اپلیکیشن نمایش داده نمی‌شود."}
            </p>
          </div>
          <Switch checked={isActive} id="category-active" onCheckedChange={setIsActive} />
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
                hint={category ? "شناسه‌ای که اپلیکیشن با آن به این دسته ارجاع می‌دهد." : "خالی بگذارید تا خودکار ساخته شود."}
                htmlFor="category-slug"
                label="شناسه لاتین (slug)"
              >
                <Input
                  aria-invalid={Boolean(action.errors.slug)}
                  className="text-left font-mono text-[12.5px]"
                  dir="ltr"
                  id="category-slug"
                  maxLength={120}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="planting"
                  value={slug}
                />
              </Field>
              <Field
                error={action.errors.sortOrder}
                hint="عدد کوچک‌تر بالاتر نمایش داده می‌شود. خالی: انتهای فهرست."
                htmlFor="category-order"
                label="ترتیب نمایش"
              >
                <Input
                  aria-invalid={Boolean(action.errors.sortOrder)}
                  className="text-left"
                  dir="ltr"
                  id="category-order"
                  inputMode="numeric"
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
        <Button loading={action.pending} type="submit">
          {category ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
        </Button>
      </DialogFooter>
    </form>
  );
}
