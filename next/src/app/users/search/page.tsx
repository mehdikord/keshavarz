"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Sprout,
  Tag,
  Wrench,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PersianCalendar } from "@/components/shared/persian-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAppCatalogTree } from "@/lib/api/app-catalog";
import { fetchAppLands, mapAppLandToUi } from "@/lib/api/app-lands";
import { createAppServiceSearch } from "@/lib/api/app-search";
import { isApiClientError } from "@/lib/api/envelope";
import { searchFormSchema } from "@/lib/validators/search";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import type { Land } from "@/types";

export default function ConsumerSearchPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [lands, setLands] = useState<Land[]>([]);
  const [catalog, setCatalog] = useState<
    Awaited<ReturnType<typeof fetchAppCatalogTree>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [landId, setLandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    void Promise.all([
      fetchAppLands({ limit: 50, signal: controller.signal }),
      fetchAppCatalogTree(controller.signal),
    ])
      .then(([landsResult, catalogTree]) => {
        if (controller.signal.aborted) return;
        setLands(
          landsResult.items.map((land) => mapAppLandToUi(land, user.id)),
        );
        setCatalog(catalogTree);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری اطلاعات جستجو ناموفق بود",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  const selectedCategory = catalog.find(
    (category) => category.categoryId === categoryId,
  );
  const selectedLand = lands.find((land) => land.id === landId);
  const selectedService = selectedCategory?.services.find(
    (service) => service.serviceId === serviceId,
  );

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSearch = async () => {
    if (!user) return;

    const parsed = searchFormSchema.safeParse({
      landId,
      categoryId,
      serviceId,
      scheduledDates,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      if (fieldErrors.scheduledDates) {
        setIsCalendarOpen(true);
      }
      return;
    }

    setErrors({});
    setSearching(true);

    try {
      const search = await createAppServiceSearch({
        categoryId: parsed.data.categoryId,
        dates: parsed.data.scheduledDates,
        landId: parsed.data.landId,
        serviceId: parsed.data.serviceId,
      });

      router.push(`/users/search/results?searchId=${search.searchId}`);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "جستجو ناموفق بود",
        isApiClientError(cause) && cause.code === "NOT_FOUND"
          ? "خدمات‌دهنده‌ای یافت نشد. خدمت یا زمین دیگری امتحان کنید."
          : undefined,
      );
    } finally {
      setSearching(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader title="جستجوی خدمات" backHref="/users/home" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

  if (lands.length === 0) {
    return (
      <PageContainer withDock>
        <PageHeader title="جستجوی خدمات" backHref="/users/home" />
        <Card className="border-accent/25 bg-accent/5">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sprout className="size-7" />
            </div>
            <div>
              <p className="font-semibold">ابتدا زمین اضافه کنید</p>
              <p className="mt-1 text-sm text-muted-foreground">
                برای جستجوی خدمات باید حداقل یک زمین ثبت شده داشته باشید.
              </p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/users/lands/new">افزودن زمین</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="جستجوی خدمات"
        description="سرویس مناسب زمینت را سریع و مطمئن پیدا کن"
        backHref="/users/home"
      />

      <section className="relative mb-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#1f513d_0%,#2d6a4f_55%,#40916c_100%)] px-5 py-5 text-white shadow-[0_18px_38px_rgba(45,106,79,0.22)] animate-slide-up">
        <div className="pointer-events-none absolute -left-12 -top-12 size-36 rounded-full border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-12 size-40 rounded-full border border-white/10 bg-white/5" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#ffd39f]" />
            پیشنهاد هوشمند خدمات کشاورزی
          </div>

          <div className="max-w-72">
            <h2 className="text-xl font-black leading-8">
              خدمات مورد نیاز زمینت، فقط چند انتخاب فاصله دارد
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/70">
              جزئیات کار را مشخص کن تا نزدیک‌ترین خدمات‌دهندگان آماده را
              برایت پیدا کنیم.
            </p>
          </div>
        </div>
      </section>

      <Card className="card-elevated mb-4 overflow-hidden rounded-[28px] border-primary/10 bg-surface shadow-[0_14px_34px_rgba(45,106,79,0.09)]">
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-gradient-to-l from-primary/[0.035] to-transparent p-3.5 transition-colors focus-within:border-primary/30">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-4" />
              </span>
              <div>
                <Label className="text-sm font-bold">کدام زمین؟</Label>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  محل انجام کار و محدوده جستجو
                </p>
              </div>
            </div>
            <Select
              dir="rtl"
              value={landId}
              onValueChange={(value) => {
                setLandId(value);
                clearError("landId");
              }}
            >
              <SelectTrigger
                className="h-12 w-full rounded-xl border-border/80 bg-surface px-3.5 shadow-sm data-[placeholder]:text-muted-foreground/80"
                aria-invalid={Boolean(errors.landId)}
              >
                <SelectValue placeholder="یکی از زمین‌ها را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-right" dir="rtl">
                {lands.map((land) => (
                  <SelectItem
                    key={land.id}
                    value={land.id}
                    className="justify-start rounded-lg text-right"
                  >
                    {land.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.landId ? (
              <p className="mt-2 text-xs font-medium text-destructive">
                {errors.landId}
              </p>
            ) : null}
            {selectedLand ? (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <Check className="size-3.5" />
                محدوده جستجو بر اساس «{selectedLand.title}» تنظیم شد
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 bg-gradient-to-l from-accent/[0.055] to-transparent p-3.5 transition-colors focus-within:border-accent/40">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-[#d97832]">
                <Wrench className="size-4" />
              </span>
              <div>
                <Label className="text-sm font-bold">چه خدمتی نیاز دارید؟</Label>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  ابتدا گروه و سپس نوع دقیق خدمت را انتخاب کنید
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Tag className="pointer-events-none absolute right-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Select
                  dir="rtl"
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value);
                    setServiceId("");
                    clearError("categoryId");
                    clearError("serviceId");
                  }}
                >
                  <SelectTrigger
                    className="h-12 w-full rounded-xl border-border/80 bg-surface pr-10 shadow-sm data-[placeholder]:text-muted-foreground/80"
                    aria-invalid={Boolean(errors.categoryId)}
                  >
                    <SelectValue placeholder="انتخاب دسته‌بندی خدمت" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-right" dir="rtl">
                    {catalog.map((category) => (
                      <SelectItem
                        key={category.categoryId}
                        value={category.categoryId}
                        className="justify-start rounded-lg text-right"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Wrench className="pointer-events-none absolute right-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Select
                  dir="rtl"
                  value={serviceId}
                  onValueChange={(value) => {
                    setServiceId(value);
                    clearError("serviceId");
                  }}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger
                    className="h-12 w-full rounded-xl border-border/80 bg-surface pr-10 shadow-sm data-[placeholder]:text-muted-foreground/80 disabled:bg-muted/40"
                    aria-invalid={Boolean(errors.serviceId)}
                  >
                    <SelectValue
                      placeholder={
                        selectedCategory
                          ? "انتخاب خدمت دقیق"
                          : "ابتدا دسته‌بندی را انتخاب کنید"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-right" dir="rtl">
                    {selectedCategory?.services.map((service) => (
                      <SelectItem
                        key={service.serviceId}
                        value={service.serviceId}
                        className="justify-start rounded-lg text-right"
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {errors.categoryId || errors.serviceId ? (
              <p className="mt-2 text-xs font-medium text-destructive">
                {errors.categoryId ?? errors.serviceId}
              </p>
            ) : null}
            {selectedService ? (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[#c66424]">
                <Check className="size-3.5" />
                خدمت «{selectedService.name}» انتخاب شد
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 bg-gradient-to-l from-[#f2c14e]/[0.08] to-transparent p-3.5">
            <button
              type="button"
              onClick={() => setIsCalendarOpen((open) => !open)}
              className="flex w-full items-center gap-3 rounded-xl text-right outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-expanded={isCalendarOpen}
              aria-controls="work-date-calendar"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2c14e]/20 text-[#a56b00]">
                <CalendarDays className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">
                  {scheduledDates.length > 0
                    ? `${scheduledDates.length.toLocaleString("fa-IR")} تاریخ انتخاب شده`
                    : "انتخاب تاریخ انجام کار"}
                </span>
                <span className="mt-0.5 block text-[10px] leading-5 text-muted-foreground">
                  {scheduledDates.length > 0
                    ? "برای مشاهده یا تغییر تاریخ‌ها بزنید"
                    : "می‌توانید یک یا چند روز مناسب انتخاب کنید"}
                </span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground shadow-sm">
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${
                    isCalendarOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            {scheduledDates.length > 0 && !isCalendarOpen ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {scheduledDates.map((date) => (
                  <Badge
                    key={date}
                    variant="secondary"
                    className="gap-1.5 rounded-full bg-primary/[0.07] px-3 py-1 text-[10px] font-medium text-primary"
                  >
                    {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(date))}
                    <button
                      type="button"
                      onClick={() =>
                        setScheduledDates((current) =>
                          current.filter((item) => item !== date),
                        )
                      }
                      className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                      aria-label="حذف تاریخ"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}

            {isCalendarOpen ? (
              <div
                id="work-date-calendar"
                className="mt-4 border-t border-border/60 pt-4 animate-fade-in"
              >
                <PersianCalendar
                  selectedDates={scheduledDates}
                  onChange={(dates) => {
                    setScheduledDates(dates);
                    if (dates.length > 0) {
                      clearError("scheduledDates");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 h-10 w-full rounded-xl"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  <Check className="size-4" />
                  تأیید تاریخ‌ها
                </Button>
              </div>
            ) : null}

            {errors.scheduledDates ? (
              <p className="mt-2 text-xs font-medium text-destructive">
                {errors.scheduledDates}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[0.035] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-muted-foreground">خلاصه درخواست</span>
              <span className="max-w-52 truncate font-semibold text-foreground">
                {selectedService?.name ?? "خدمت انتخاب نشده"}
                {selectedLand ? ` برای ${selectedLand.title}` : ""}
              </span>
            </div>
          </div>

          <Button
            type="button"
            className="h-13 w-full rounded-2xl bg-[linear-gradient(90deg,#e76f51_0%,#f4a261_100%)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(231,111,81,0.24)] transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_14px_28px_rgba(231,111,81,0.28)]"
            onClick={() => void handleSearch()}
            disabled={searching}
          >
            <Search className="size-5" />
            {searching ? "در حال جستجو..." : "مشاهده خدمات‌دهندگان مناسب"}
          </Button>
          <p className="text-center text-[10px] leading-5 text-muted-foreground">
            نتایج بر اساس موقعیت زمین، نوع خدمت و دسترسی خدمات‌دهندگان نمایش
            داده می‌شود.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
