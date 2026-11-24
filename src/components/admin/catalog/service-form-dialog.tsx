"use client";

import { ChevronDown, ExternalLink, FileText, RotateCw, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { Skeleton } from "@/components/admin/ui/skeleton";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi, errorMessage } from "@/lib/admin/api";
import type { RichDoc } from "@/lib/rich-content/rich-content";
import { cn } from "@/lib/utils";
import type { AdminServiceItem } from "@/server/modules/admin/catalog/catalog-admin.service";

import { type ImageChange, ImageField, NO_IMAGE_CHANGE, toLatinDigits } from "./image-field";
import { applyImageChange } from "./save-with-image";

// The editor (ProseMirror) is heavy; load it only when the form opens.
const RichTextEditor = dynamic(() => import("./rich-text-editor").then((module) => module.RichTextEditor), {
  loading: () => <EditorSkeleton />,
  ssr: false,
});

function EditorSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-input">
      <Skeleton className="h-[46px] rounded-none" />
      <div className="grid gap-3 p-5">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

type DetailsState =
  | { status: "loading" }
  | { message: string; status: "error" }
  | { doc: RichDoc | null; status: "ready" };

/** Loads the stored intro body for editing; a new service starts empty. */
function useServiceDetails(serviceId: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailsState>(
    serviceId ? { status: "loading" } : { doc: null, status: "ready" },
  );

  useEffect(() => {
    if (!serviceId) return;
    const controller = new AbortController();
    adminApi
      .get<{ details: RichDoc | null }>(`/catalog/services/${serviceId}`, undefined, controller.signal)
      .then((result) => setState({ doc: result.details, status: "ready" }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ message: errorMessage(error), status: "error" });
      });
    return () => controller.abort();
  }, [serviceId, attempt]);

  return {
    retry: () => {
      setState({ status: "loading" });
      setAttempt((value) => value + 1);
    },
    state,
  };
}

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
            ? "تغییر نام، تصویر، وضعیت یا صفحه معرفی، بلافاصله در اپلیکیشن خدمات‌گیرندگان و خدمات‌دهندگان دیده می‌شود."
            : "خدمت جدید پس از ذخیره در جستجوی خدمات‌گیرنده و فهرست انتخاب خدمات‌دهندگان قرار می‌گیرد."
        }
        // Typing in the editor must not dismiss the dialog by a stray outside click.
        onInteractOutside={(event) => event.preventDefault()}
        size="xl"
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
  const [isSpecial, setIsSpecial] = useState(service?.isSpecial ?? false);
  const details = useServiceDetails(service?.id ?? null);
  /** Only set once the admin edits the text, so an untouched body is never re-sent. */
  const [detailsDraft, setDetailsDraft] = useState<{ doc: RichDoc | null } | null>(null);
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
      ...(detailsDraft ? { details: detailsDraft.doc } : {}),
      isActive,
      isSpecial,
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
          hint="یک یا دو جمله؛ در جستجو و بالای صفحه معرفی خدمت نمایش داده می‌شود. حداکثر ۱۰۰۰ نویسه."
          htmlFor="service-description"
          label="توضیحات کوتاه"
        >
          <Textarea
            aria-invalid={Boolean(action.errors.description)}
            id="service-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="کاری که در این خدمت انجام می‌شود، در یک نگاه"
            rows={2}
            value={description}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            checked={isActive}
            description={
              isActive
                ? "خدمت در جستجو و پروفایل خدمات‌دهندگان نمایش داده می‌شود."
                : "خدمت پنهان می‌شود؛ درخواست‌ها و سوابق قبلی حفظ می‌شوند."
            }
            id="service-active"
            label="فعال در اپلیکیشن"
            onCheckedChange={setIsActive}
          />
          <ToggleCard
            checked={isSpecial}
            description={
              isSpecial
                ? !isActive
                  ? "ویژه است، اما تا وقتی غیرفعال است در صفحه اصلی دیده نمی‌شود."
                  : !service?.image && !image.file
                    ? "در صفحه اصلی نمایش داده می‌شود؛ برای جلوه بهتر یک تصویر بارگذاری کنید."
                    : "در بخش «آیا این ادوات را می‌شناسید؟» صفحه اصلی، به‌صورت تصادفی نمایش داده می‌شود."
                : "با فعال کردن، خدمت در بخش ادوات ویژه صفحه اصلی اپلیکیشن قرار می‌گیرد."
            }
            icon={<Sparkles className="size-4" />}
            id="service-special"
            label="خدمت ویژه"
            onCheckedChange={setIsSpecial}
            tone="wheat"
          />
        </div>

        <section aria-labelledby="service-details-label" className="grid gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <label
                className="flex items-center gap-1.5 text-[13px] font-semibold"
                htmlFor="service-details"
                id="service-details-label"
              >
                <FileText className="size-4 text-muted-foreground" />
                توضیحات کامل (صفحه معرفی خدمت)
              </label>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                معرفی کامل دستگاه یا خدمت با سرتیتر، جدول مشخصات، تصویر و نکات کاربردی. در صفحه اختصاصی خدمت به کاربران نمایش داده می‌شود.
              </p>
            </div>
            {service ? (
              <a
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                href={`/services/${encodeURIComponent(service.slug)}`}
                rel="noreferrer"
                target="_blank"
              >
                مشاهده صفحه خدمت
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
          {details.state.status === "loading" ? (
            <EditorSkeleton />
          ) : details.state.status === "error" ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">بارگذاری متن صفحه معرفی ممکن نشد: {details.state.message}</p>
              <Button onClick={details.retry} size="sm" type="button" variant="outline">
                <RotateCw />
                تلاش دوباره
              </Button>
            </div>
          ) : (
            <RichTextEditor
              id="service-details"
              initialContent={details.state.doc}
              invalid={Boolean(action.errors.details)}
              onChange={(doc, isEmpty) => setDetailsDraft({ doc: isEmpty ? null : doc })}
              placeholder="مثلاً: این دستگاه چیست، چه کاری انجام می‌دهد، مشخصات فنی، مزایا و نکات پیش از درخواست…"
            />
          )}
          {action.errors.details ? <p className="text-xs text-danger">{action.errors.details}</p> : null}
        </section>

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
        <Button
          disabled={categories.length === 0 || (details.state.status !== "ready" && Boolean(service))}
          loading={action.pending}
          type="submit"
        >
          {service ? "ذخیره تغییرات" : "افزودن خدمت"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ToggleCard({
  checked,
  description,
  icon,
  id,
  label,
  onCheckedChange,
  tone,
}: {
  checked: boolean;
  description: string;
  icon?: React.ReactNode;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  tone?: "wheat";
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border border-line px-4 py-3 transition-colors",
        tone === "wheat" && checked && "border-wheat/50 bg-wheat-soft",
      )}
    >
      <div className="min-w-0">
        <label className="flex items-center gap-1.5 text-[13px] font-semibold" htmlFor={id}>
          {icon ? <span className={cn("text-muted-foreground", tone === "wheat" && checked && "text-wheat-ink")}>{icon}</span> : null}
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        className={cn("mt-0.5", tone === "wheat" && checked && "bg-wheat")}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
