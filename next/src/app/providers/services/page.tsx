"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MapPicker } from "@/components/shared/map-picker";
import { PriceDisplay } from "@/components/shared/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { fetchAppCatalogTree, type AppService } from "@/lib/api/app-catalog";
import { isApiClientError } from "@/lib/api/envelope";
import {
  createAppProviderService,
  deleteAppProviderService,
  fetchAppProviderProfile,
  fetchAppProviderServices,
  patchAppProviderWorkArea,
  updateAppProviderService,
  upsertAppProviderProfile,
  type AppProviderProfile,
  type AppProviderService,
} from "@/lib/api/app-provider";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/defaults";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toLatinDigits, toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation } from "@/types";

type LoadState = "loading" | "ready" | "error";

function profileToWorkCenter(profile: AppProviderProfile): GeoLocation | null {
  if (!profile.workLatitude || !profile.workLongitude) return null;
  return {
    lat: Number(profile.workLatitude),
    lng: Number(profile.workLongitude),
  };
}

async function ensureProviderProfile(
  signal?: AbortSignal,
): Promise<AppProviderProfile> {
  try {
    return await fetchAppProviderProfile(signal);
  } catch (cause: unknown) {
    if (isApiClientError(cause) && cause.status === 404) {
      return upsertAppProviderProfile({});
    }
    throw cause;
  }
}

export default function ProviderServicesPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<AppProviderProfile | null>(null);
  const [services, setServices] = useState<AppProviderService[]>([]);
  const [catalog, setCatalog] = useState<
    Array<{ categoryId: string; name: string; services: AppService[] }>
  >([]);

  const [workCenter, setWorkCenter] = useState<GeoLocation | null>(null);
  const [workRadiusKm, setWorkRadiusKm] = useState(50);
  const [savingWorkArea, setSavingWorkArea] = useState(false);

  const [workAreaOpen, setWorkAreaOpen] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reloadServices = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchAppProviderServices({ signal, limit: 50 });
    return result.items;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const [nextProfile, nextServices, nextCatalog] = await Promise.all([
          ensureProviderProfile(controller.signal),
          reloadServices(controller.signal),
          fetchAppCatalogTree(controller.signal),
        ]);

        if (cancelled) return;

        setProfile(nextProfile);
        setServices(nextServices);
        setCatalog(nextCatalog);
        setWorkCenter(profileToWorkCenter(nextProfile));
        setWorkRadiusKm(nextProfile.workRadiusKm);
        setLoadState("ready");
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;
        setLoadState("error");
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری اطلاعات ناموفق بود.",
        );
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadServices]);

  const selectedCategory = catalog.find(
    (category) => category.categoryId === categoryId,
  );

  const offeredServiceIds = useMemo(
    () => new Set(services.map((item) => item.serviceId)),
    [services],
  );

  const handleSaveWorkArea = async () => {
    const center = workCenter ?? DEFAULT_MAP_CENTER;

    setSavingWorkArea(true);
    try {
      const nextProfile = await patchAppProviderWorkArea({
        workLatitude: String(center.lat),
        workLongitude: String(center.lng),
        workRadiusKm,
      });
      setProfile(nextProfile);
      toast.success("محدوده کاری ذخیره شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ذخیره محدوده کاری ناموفق بود.",
      );
    } finally {
      setSavingWorkArea(false);
    }
  };

  const handleAddService = async () => {
    const price = Number(toLatinDigits(priceInput.replace(/[^\d]/g, "")));

    if (!serviceId) {
      toast.error("خدمت را انتخاب کنید");
      return;
    }

    if (!price || price < 1000) {
      toast.error("قیمت معتبر وارد کنید");
      return;
    }

    if (offeredServiceIds.has(serviceId)) {
      toast.error("این خدمت قبلاً ثبت شده است");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAppProviderService({
        priceToman: price,
        serviceId,
      });
      setServices((prev) => [...prev, created]);
      setServiceId("");
      setCategoryId("");
      setPriceInput("");
      setIsAddFormOpen(false);
      toast.success("خدمت اضافه شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ثبت خدمت ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!editTarget) return;

    const price = Number(toLatinDigits(editPrice.replace(/[^\d]/g, "")));
    if (!price || price < 1000) {
      toast.error("قیمت معتبر وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateAppProviderService(editTarget, {
        priceToman: price,
      });
      setServices((prev) =>
        prev.map((item) =>
          item.providerServiceId === editTarget ? updated : item,
        ),
      );
      setEditTarget(null);
      setEditPrice("");
      toast.success("قیمت به‌روزرسانی شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "به‌روزرسانی قیمت ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      await deleteAppProviderService(deleteTarget);
      setServices((prev) =>
        prev.filter((item) => item.providerServiceId !== deleteTarget),
      );
      setDeleteTarget(null);
      toast.success("خدمت حذف شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "حذف خدمت ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadState === "loading") {
    return (
      <PageContainer withDock>
        <PageHeader
          title="ارائه خدمات"
          description="محدوده کاری و خدمات قابل ارائه"
        />
        <div className="flex justify-center py-16">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (loadState === "error") {
    return (
      <PageContainer withDock>
        <PageHeader
          title="ارائه خدمات"
          description="محدوده کاری و خدمات قابل ارائه"
        />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            بارگذاری اطلاعات ناموفق بود. صفحه را دوباره باز کنید.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const workAreaConfigured = Boolean(profile?.workLatitude && profile?.workLongitude);

  return (
    <PageContainer withDock>
      <PageHeader
        title="ارائه خدمات"
        description="محدوده کاری و خدمات قابل ارائه"
      />

      {!workAreaConfigured ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 animate-fade-in">
          <AlertTriangle className="size-4.5 shrink-0 text-amber-600" />
          <span>موقعیت و محدوده کاری خود را ثبت کنید !</span>
        </div>
      ) : null}

      <Card className="card-elevated mb-8 gap-0 overflow-hidden rounded-2xl border-primary/10 p-0 shadow-[0_8px_24px_rgba(45,106,79,0.08)]">
        <button
          type="button"
          onClick={() => setWorkAreaOpen((value) => !value)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-right transition-colors hover:bg-primary/[0.025]"
          aria-expanded={workAreaOpen}
          aria-controls="provider-work-area"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">محدوده کاری</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                پوشش فعلی تا شعاع {toPersianDigits(workRadiusKm)} کیلومتر
              </p>
            </div>
          </div>
          <span className="flex items-center gap-2">
            <Badge
              variant={workAreaConfigured ? "success" : "outline"}
              className="border border-success/10 px-2 py-0.5 text-[9px]"
            >
              {workAreaConfigured ? "تنظیم شده" : "نیاز به تنظیم"}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                workAreaOpen && "rotate-180",
              )}
            />
          </span>
        </button>

        {workAreaOpen ? (
          <CardContent
            id="provider-work-area"
            className="space-y-3.5 border-t border-border/60 p-3.5 animate-fade-in"
          >
            <MapPicker
              value={workCenter}
              onChange={(location) => setWorkCenter(location)}
            />

            <div className="rounded-xl border border-primary/10 bg-primary/[0.035] p-3">
              <div className="mb-3 flex items-center justify-between text-xs">
                <Label className="font-semibold">شعاع پوشش خدمات</Label>
                <span className="rounded-full bg-surface px-2.5 py-1 font-bold text-primary shadow-sm">
                  {toPersianDigits(workRadiusKm)} کیلومتر
                </span>
              </div>
              <Slider
                min={20}
                max={100}
                step={5}
                value={[workRadiusKm]}
                onValueChange={(value) => setWorkRadiusKm(value[0] ?? 50)}
              />
            </div>

            <Button
              type="button"
              className="h-10 w-full rounded-xl text-xs"
              onClick={() => void handleSaveWorkArea()}
              disabled={savingWorkArea}
            >
              {savingWorkArea ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              ذخیره محدوده کاری
            </Button>
          </CardContent>
        ) : null}
      </Card>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <Wrench className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">خدمات قابل ارائه</h2>
                <Badge
                  variant="success"
                  className="px-2 py-0.5 text-[9px] font-bold"
                >
                  {toPersianDigits(services.length)} خدمت
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                مدیریت خدمات و قیمت‌های پیشنهادی شما
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={isAddFormOpen ? "outline" : "default"}
            className={cn(
              "h-9 shrink-0 rounded-xl px-3 text-[11px]",
              !isAddFormOpen &&
                "shadow-[0_7px_16px_rgba(45,106,79,0.18)]",
            )}
            onClick={() => setIsAddFormOpen((open) => !open)}
            aria-expanded={isAddFormOpen}
            aria-controls="add-provider-service-form"
          >
            {isAddFormOpen ? (
              <X className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {isAddFormOpen ? "بستن" : "افزودن خدمت"}
          </Button>
        </div>

        {isAddFormOpen ? (
          <Card
            id="add-provider-service-form"
            className="gap-0 overflow-hidden rounded-[22px] border-accent/20 bg-surface p-0 shadow-[0_12px_28px_rgba(244,162,97,0.12)] animate-fade-in"
          >
            <div className="flex items-center gap-2.5 bg-gradient-to-l from-accent/10 via-accent/[0.04] to-transparent px-3.5 py-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-[#d97832]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">افزودن خدمت جدید</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  نوع خدمت و قیمت پیشنهادی را مشخص کنید
                </p>
              </div>
            </div>

            <CardContent className="space-y-4 border-t border-border/50 p-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">دسته‌بندی</Label>
                <Select
                  dir="rtl"
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value);
                    setServiceId("");
                  }}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl bg-surface shadow-sm">
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

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">خدمت</Label>
                <Select
                  dir="rtl"
                  value={serviceId}
                  onValueChange={setServiceId}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl bg-surface shadow-sm disabled:bg-muted/40">
                    <SelectValue
                      placeholder={
                        selectedCategory
                          ? "انتخاب خدمت قابل ارائه"
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
                        disabled={offeredServiceIds.has(service.serviceId)}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-semibold">
                  قیمت پیشنهادی (تومان)
                </Label>
                <div className="relative">
                  <CircleDollarSign className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    className="h-12 rounded-xl bg-surface pr-10 shadow-sm"
                    placeholder="مثلاً ۵۰۰۰۰۰۰"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="h-12 w-full rounded-xl"
                onClick={() => void handleAddService()}
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                ثبت خدمت جدید
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {services.length === 0 ? (
          <Card className="gap-0 rounded-[22px] border-dashed border-primary/20 bg-primary/[0.025] p-0 shadow-none">
            <CardContent className="px-5 py-7 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wrench className="size-6" />
              </div>
              <p className="mt-3 text-sm font-bold">هنوز خدمتی ثبت نشده</p>
              <p className="mx-auto mt-1 max-w-64 text-[11px] leading-5 text-muted-foreground">
                اولین خدمت خود را اضافه کنید تا خدمات‌گیرندگان بتوانند شما را
                در نتایج جستجو ببینند.
              </p>
              {!isAddFormOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => setIsAddFormOpen(true)}
                >
                  <Plus className="size-4" />
                  افزودن اولین خدمت
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card
                key={service.providerServiceId}
                className="group gap-0 overflow-hidden rounded-[22px] border-primary/10 bg-surface p-0 shadow-[0_7px_22px_rgba(45,106,79,0.07)] transition-all duration-200 hover:border-primary/20 hover:shadow-[0_11px_26px_rgba(45,106,79,0.11)]"
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-3 p-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-success/10 text-primary">
                      <Wrench className="size-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {service.serviceName}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={service.isActive ? "success" : "outline"}
                              className="px-2 py-0.5 text-[9px]"
                            >
                              {service.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-muted/45 p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-primary hover:bg-surface hover:text-primary"
                            onClick={() => {
                              setEditTarget(service.providerServiceId);
                              setEditPrice(String(service.priceToman));
                            }}
                            aria-label={`ویرایش قیمت ${service.serviceName}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-destructive hover:bg-surface hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget(service.providerServiceId)
                            }
                            aria-label={`حذف ${service.serviceName}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editTarget === service.providerServiceId ? (
                    <div className="border-t border-primary/10 bg-primary/[0.035] p-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Input
                          inputMode="numeric"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-xl bg-surface"
                          aria-label={`قیمت جدید ${service.serviceName}`}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-10 rounded-xl"
                          onClick={() => void handleUpdatePrice()}
                          disabled={submitting}
                        >
                          <Check className="size-3.5" />
                          ذخیره
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-xl text-muted-foreground"
                          onClick={() => {
                            setEditTarget(null);
                            setEditPrice("");
                          }}
                          aria-label="انصراف از ویرایش"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-t border-primary/10 bg-gradient-to-l from-primary/[0.055] to-transparent px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                        <CircleDollarSign className="size-3.5 text-accent" />
                        قیمت پیشنهادی
                      </div>
                      <PriceDisplay
                        amount={service.priceToman}
                        size="sm"
                        className="font-black"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف خدمت"
        description="آیا از حذف این خدمت مطمئن هستید؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => void handleDeleteService()}
      />
    </PageContainer>
  );
}
