"use client";

import { useMemo, useState } from "react";
import { Check, LoaderCircle, Search, Sparkles, Sprout, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { usePriceInput } from "@/hooks/use-price-input";
import type { AppCategory, AppService } from "@/lib/api/app-catalog";
import {
  PRICING_UNIT_LABELS,
  PRICING_UNITS,
  type AppPricingUnit,
  type AppProviderService,
} from "@/lib/api/app-provider";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const MIN_PRICE = 1000;
const MAX_DESCRIPTION = 1000;

export type CatalogTree = Array<AppCategory & { services: AppService[] }>;

export type ServiceEditorMode =
  | { kind: "add" }
  | { kind: "edit"; service: AppProviderService };

export interface ServiceEditorValues {
  serviceId: string;
  priceToman: number;
  pricingUnit: AppPricingUnit;
  description: string | null;
}

interface ServiceEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ServiceEditorMode;
  /** Changes on every open so the form starts fresh. */
  formKey: number;
  catalog: CatalogTree;
  /** serviceId → whether the existing entry is still active. */
  offered: Map<string, boolean>;
  onSubmit: (values: ServiceEditorValues) => Promise<boolean>;
}

export function ServiceEditorSheet({
  open,
  onOpenChange,
  mode,
  formKey,
  catalog,
  offered,
  onSubmit,
}: ServiceEditorSheetProps) {
  const isEdit = mode.kind === "edit";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[92dvh] max-w-[430px] flex-col gap-0 rounded-t-[30px] border-0 bg-background p-0"
      >
        <div className="relative shrink-0 px-5 pb-3 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-border" />
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffb85c] to-[#e07b1f] text-white shadow-[0_10px_20px_-10px_rgba(224,123,31,0.8)]">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1 text-right">
              <SheetTitle className="text-base font-black">
                {isEdit ? "ویرایش خدمت" : "افزودن خدمت جدید"}
              </SheetTitle>
              <SheetDescription className="mt-0.5 truncate text-[11.5px]">
                {isEdit ? mode.service.serviceName : "خدمت، واحد و قیمت پیشنهادی را مشخص کنید"}
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="بستن"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <ServiceEditorForm
          key={formKey}
          mode={mode}
          catalog={catalog}
          offered={offered}
          onSubmit={onSubmit}
        />
      </SheetContent>
    </Sheet>
  );
}

function ServiceEditorForm({
  mode,
  catalog,
  offered,
  onSubmit,
}: Pick<ServiceEditorSheetProps, "mode" | "catalog" | "offered" | "onSubmit">) {
  const editing = mode.kind === "edit" ? mode.service : null;

  const [serviceId, setServiceId] = useState(editing?.serviceId ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<AppPricingUnit>(
    (PRICING_UNITS as readonly string[]).includes(editing?.pricingUnit ?? "")
      ? (editing?.pricingUnit as AppPricingUnit)
      : "per_hectare",
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const price = usePriceInput(editing ? String(editing.priceToman) : "");

  const priceValue = Number(price.rawValue);
  const priceError = !price.rawValue
    ? "قیمت را وارد کنید"
    : priceValue < MIN_PRICE
      ? `حداقل قیمت ${toPersianDigits("1,000")} تومان است`
      : null;
  const serviceError = !serviceId ? "یک خدمت انتخاب کنید" : null;

  const visibleServices = useMemo(() => {
    const term = query.trim();
    return catalog
      .filter((category) => term || !categoryId || category.categoryId === categoryId)
      .flatMap((category) =>
        category.services
          .filter((service) =>
            term
              ? service.name.includes(term) || (service.description ?? "").includes(term)
              : true,
          )
          .map((service) => ({ ...service, categoryName: category.name })),
      );
  }, [catalog, categoryId, query]);

  const handleSubmit = async () => {
    setShowErrors(true);
    if (priceError || serviceError) return;

    setSubmitting(true);
    const ok = await onSubmit({
      serviceId,
      priceToman: priceValue,
      pricingUnit: unit,
      description: description.trim() || null,
    });
    if (!ok) setSubmitting(false);
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 pb-6 pt-2">
        {!editing ? (
          <FormStep index={1} title="انتخاب خدمت" error={showErrors ? serviceError : null}>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی خدمت، مثلاً شخم یا سم‌پاشی"
                className="h-11 w-full rounded-2xl bg-surface pr-10 pl-3 text-[13px] outline-none ring-1 ring-border/70 transition focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {!query.trim() ? (
              <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
                <CategoryChip active={categoryId === null} onClick={() => setCategoryId(null)}>
                  همه
                </CategoryChip>
                {catalog.map((category) => (
                  <CategoryChip
                    key={category.categoryId}
                    active={categoryId === category.categoryId}
                    onClick={() => setCategoryId(category.categoryId)}
                  >
                    {category.name}
                  </CategoryChip>
                ))}
              </div>
            ) : null}

            <ul className="mt-3 max-h-60 space-y-1.5 overflow-y-auto overscroll-contain rounded-2xl bg-surface p-1.5 ring-1 ring-border/60">
              {visibleServices.length === 0 ? (
                <li className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  خدمتی با این مشخصات پیدا نشد
                </li>
              ) : (
                visibleServices.map((service) => {
                  const existing = offered.get(service.serviceId);
                  const disabled = existing !== undefined;
                  const selected = service.serviceId === serviceId;
                  return (
                    <li key={service.serviceId}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setServiceId(service.serviceId)}
                        aria-pressed={selected}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors",
                          selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60",
                          disabled && "cursor-not-allowed opacity-55 hover:bg-transparent",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl",
                            selected ? "bg-primary text-primary-foreground" : "bg-[#d8f3dc] text-[#2d6a4f]",
                          )}
                        >
                          {selected ? <Check className="size-4" strokeWidth={2.75} /> : <Sprout className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-foreground">{service.name}</span>
                          <span className="block truncate text-[10.5px] text-muted-foreground">
                            {service.categoryName}
                          </span>
                        </span>
                        {disabled ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {existing ? "ثبت شده" : "حذف شده"}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </FormStep>
        ) : null}

        <FormStep index={editing ? 1 : 2} title="واحد قیمت‌گذاری">
          <div className="grid grid-cols-3 gap-2">
            {PRICING_UNITS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUnit(option)}
                aria-pressed={unit === option}
                className={cn(
                  "h-11 rounded-2xl px-2 text-[12px] font-bold transition-all",
                  unit === option
                    ? "bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(45,106,79,0.9)]"
                    : "bg-surface text-foreground/80 ring-1 ring-border/70 hover:ring-primary/30",
                )}
              >
                {PRICING_UNIT_LABELS[option]}
              </button>
            ))}
          </div>
        </FormStep>

        <FormStep
          index={editing ? 2 : 3}
          title="قیمت پیشنهادی"
          error={showErrors ? priceError : null}
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl bg-surface px-4 ring-1 transition focus-within:ring-2",
              showErrors && priceError
                ? "ring-destructive/50 focus-within:ring-destructive/50"
                : "ring-border/70 focus-within:ring-primary/40",
            )}
          >
            <input
              inputMode="numeric"
              value={toPersianDigits(price.displayValue)}
              onChange={(event) => price.handleChange(event.target.value)}
              onBlur={(event) => price.handleBlur(event.target.value)}
              placeholder="۰"
              aria-label="قیمت پیشنهادی به تومان"
              className="h-14 min-w-0 flex-1 bg-transparent text-left text-xl font-black tabular-nums outline-none placeholder:text-muted-foreground/50"
              dir="ltr"
            />
            <span className="shrink-0 text-[12px] font-bold text-muted-foreground">
              تومان / {PRICING_UNIT_LABELS[unit]}
            </span>
          </div>
          {price.persianWords ? (
            <p className="mt-2 text-[11.5px] font-medium text-primary">{price.persianWords}</p>
          ) : null}
        </FormStep>

        <FormStep index={editing ? 3 : 4} title="توضیحات" optional>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={MAX_DESCRIPTION}
            placeholder="مثلاً نوع ادوات، توان تراکتور یا شرایط انجام کار"
            className="min-h-24 rounded-2xl bg-surface text-[13px] leading-6"
          />
          <p className="mt-1 text-left text-[10.5px] tabular-nums text-muted-foreground">
            {toPersianDigits(description.length)}/{toPersianDigits(MAX_DESCRIPTION)}
          </p>
        </FormStep>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-black text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)] transition active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
          {editing ? "ذخیره تغییرات" : "ثبت خدمت"}
        </button>
      </div>
    </>
  );
}

function FormStep({
  index,
  title,
  optional = false,
  error,
  children,
}: {
  index: number;
  title: string;
  optional?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
          {toPersianDigits(index)}
        </span>
        <h3 className="text-[13.5px] font-black text-foreground">{title}</h3>
        {optional ? <span className="text-[11px] text-muted-foreground">(اختیاری)</span> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-[11.5px] font-medium text-destructive">{error}</p> : null}
    </section>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-[12px] font-bold transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-surface text-foreground/75 ring-1 ring-border/70 hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
