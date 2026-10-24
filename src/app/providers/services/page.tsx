"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronDown, Images, MapPinned, Plus, RotateCw, Wrench } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderGalleryManager } from "@/components/provider-panel/provider-gallery-manager";
import { ServiceCard } from "@/components/providers-panel/services/service-card";
import {
  ServiceEditorSheet,
  type CatalogTree,
  type ServiceEditorMode,
  type ServiceEditorValues,
} from "@/components/providers-panel/services/service-editor-sheet";
import { ServicesHero } from "@/components/providers-panel/services/services-hero";
import {
  MAX_RADIUS_KM,
  MIN_RADIUS_KM,
  WorkAreaPanel,
} from "@/components/providers-panel/services/work-area-panel";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppCatalogTree } from "@/lib/api/app-catalog";
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
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation } from "@/types";

type LoadState = "loading" | "ready" | "error";
type TabKey = "services" | "area" | "gallery";

const TABS: { key: TabKey; label: string; icon: typeof Wrench }[] = [
  { key: "services", label: "خدمات من", icon: Wrench },
  { key: "area", label: "محدوده کاری", icon: MapPinned },
  { key: "gallery", label: "نمونه‌کار", icon: Images },
];

function parseTab(value: string | null): TabKey {
  return value === "area" || value === "gallery" ? value : "services";
}

function profileToWorkCenter(profile: AppProviderProfile): GeoLocation | null {
  if (!profile.workLatitude || !profile.workLongitude) return null;
  return {
    lat: Number(profile.workLatitude),
    lng: Number(profile.workLongitude),
  };
}

function clampRadius(radiusKm: number) {
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, radiusKm));
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

function ProviderServicesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [profile, setProfile] = useState<AppProviderProfile | null>(null);
  const [services, setServices] = useState<AppProviderService[]>([]);
  const [catalog, setCatalog] = useState<CatalogTree>([]);

  const [workCenter, setWorkCenter] = useState<GeoLocation | null>(null);
  const [workRadiusKm, setWorkRadiusKm] = useState(50);
  const [savingWorkArea, setSavingWorkArea] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<ServiceEditorMode>({ kind: "add" });
  const [editorKey, setEditorKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AppProviderService | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        // The profile must exist before services can be listed.
        const nextProfile = await ensureProviderProfile(controller.signal);
        if (cancelled) return;

        const [nextServices, nextCatalog] = await Promise.all([
          fetchAppProviderServices({ signal: controller.signal, limit: 50 }),
          fetchAppCatalogTree(controller.signal),
        ]);
        if (cancelled) return;

        setProfile(nextProfile);
        setServices(nextServices.items);
        setCatalog(nextCatalog);
        setWorkCenter(profileToWorkCenter(nextProfile));
        setWorkRadiusKm(clampRadius(nextProfile.workRadiusKm));
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
  }, [reloadKey]);

  const activeServices = useMemo(
    () => services.filter((item) => item.isActive),
    [services],
  );
  const removedServices = useMemo(
    () => services.filter((item) => !item.isActive),
    [services],
  );
  const offered = useMemo(
    () => new Map(services.map((item) => [item.serviceId, item.isActive])),
    [services],
  );

  const savedCenter = profile ? profileToWorkCenter(profile) : null;
  const workAreaConfigured = savedCenter !== null;
  const workAreaDirty =
    !profile ||
    workRadiusKm !== profile.workRadiusKm ||
    workCenter?.lat !== savedCenter?.lat ||
    workCenter?.lng !== savedCenter?.lng;

  const selectTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "services") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const openEditor = (mode: ServiceEditorMode) => {
    setEditorMode(mode);
    setEditorKey((key) => key + 1);
    setEditorOpen(true);
  };

  const handleSubmitService = async (values: ServiceEditorValues) => {
    try {
      if (editorMode.kind === "edit") {
        const target = editorMode.service;
        const updated = await updateAppProviderService(target.providerServiceId, {
          description: values.description,
          priceToman: values.priceToman,
          pricingUnit: values.pricingUnit,
        });
        setServices((prev) =>
          prev.map((item) =>
            item.providerServiceId === target.providerServiceId ? updated : item,
          ),
        );
        toast.success("تغییرات خدمت ذخیره شد");
      } else {
        const created = await createAppProviderService(values);
        setServices((prev) => [created, ...prev]);
        toast.success("خدمت اضافه شد", "اکنون در نتایج جستجوی کشاورزان قابل نمایش است");
      }
      setEditorOpen(false);
      return true;
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ذخیره خدمت ناموفق بود.",
      );
      return false;
    }
  };

  const handleDeleteService = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    setDeleting(true);
    try {
      await deleteAppProviderService(target.providerServiceId);
      // The API deactivates rather than deletes, so keep the row as inactive.
      setServices((prev) =>
        prev.map((item) =>
          item.providerServiceId === target.providerServiceId
            ? { ...item, isActive: false }
            : item,
        ),
      );
      setDeleteTarget(null);
      toast.success("خدمت حذف شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "حذف خدمت ناموفق بود.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveWorkArea = async () => {
    if (!workCenter) {
      toast.error("ابتدا مرکز فعالیت را روی نقشه انتخاب کنید");
      return;
    }

    setSavingWorkArea(true);
    try {
      const nextProfile = await patchAppProviderWorkArea({
        workLatitude: String(workCenter.lat),
        workLongitude: String(workCenter.lng),
        workRadiusKm,
      });
      setProfile(nextProfile);
      setWorkCenter(profileToWorkCenter(nextProfile));
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

  const loading = loadState === "loading";

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ServicesHero
          loading={loading}
          activeServices={activeServices.length}
          workRadiusKm={workRadiusKm}
          workAreaConfigured={workAreaConfigured}
        />

        <div className="sticky top-0 z-20 -mt-5 px-4 pb-3 pt-2">
          <div
            role="tablist"
            aria-label="بخش‌های ارائه خدمات"
            className="grid grid-cols-3 gap-1 rounded-[20px] bg-surface/90 p-1.5 shadow-[0_12px_30px_-16px_rgba(45,106,79,0.45)] ring-1 ring-border/60 backdrop-blur-xl"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = item.key === tab;
              const warn = item.key === "area" && loadState === "ready" && !workAreaConfigured;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(item.key)}
                  className={cn(
                    "relative flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[12.5px] font-bold transition-colors",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="services-tab-pill"
                      className="absolute inset-0 rounded-[14px] bg-primary shadow-[0_8px_18px_-10px_rgba(45,106,79,0.9)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <Icon className="relative size-4" strokeWidth={2} />
                  <span className="relative">{item.label}</span>
                  {warn ? (
                    <span className="absolute left-2 top-2 size-2 rounded-full bg-[#e8892c] ring-2 ring-surface" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-[24px]" />
              <Skeleton className="h-36 rounded-[24px]" />
              <Skeleton className="h-36 rounded-[24px]" />
            </div>
          ) : loadState === "error" ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-10 text-center ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">بارگذاری اطلاعات ناموفق بود.</p>
              <button
                type="button"
                onClick={() => {
                  setLoadState("loading");
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <RotateCw className="size-3.5" />
                تلاش مجدد
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {tab === "services" ? (
                  <div className="space-y-3">
                    {activeServices.length === 0 ? (
                      <div className="flex flex-col items-center rounded-[26px] bg-[linear-gradient(160deg,#fff6e6_0%,#ffffff_75%)] px-6 py-8 text-center ring-1 ring-[#e9c46a]/40">
                        <span className="flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#ffb85c] to-[#e07b1f] text-white shadow-[0_14px_28px_-12px_rgba(224,123,31,0.8)]">
                          <Wrench className="size-8" strokeWidth={1.75} />
                        </span>
                        <h2 className="mt-4 text-[16px] font-black text-foreground">
                          اولین خدمت خود را ثبت کنید
                        </h2>
                        <p className="mt-1.5 max-w-72 text-[12px] leading-6 text-muted-foreground">
                          با ثبت خدمت و قیمت، کشاورزان منطقه شما را در نتایج جستجو می‌بینند و
                          برایتان درخواست می‌فرستند.
                        </p>
                        <button
                          type="button"
                          onClick={() => openEditor({ kind: "add" })}
                          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-[13.5px] font-black text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)] transition active:scale-[0.98]"
                        >
                          <Plus className="size-5" strokeWidth={2.5} />
                          افزودن خدمت
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditor({ kind: "add" })}
                          className="group flex w-full items-center gap-3 rounded-[24px] border-2 border-dashed border-primary/30 bg-primary/[0.04] p-3.5 text-right transition-colors hover:bg-primary/[0.08] active:scale-[0.99]"
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_rgba(45,106,79,0.9)] transition-transform group-hover:rotate-90">
                            <Plus className="size-5" strokeWidth={2.5} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-black text-primary">افزودن خدمت جدید</span>
                            <span className="block text-[11.5px] text-muted-foreground">
                              هر خدمت بیشتر، شانس دیده‌شدن بیشتر
                            </span>
                          </span>
                        </button>

                        <div className="flex items-center justify-between px-1 pt-2">
                          <h2 className="text-[15px] font-black text-foreground">خدمات فعال</h2>
                          <span className="rounded-full bg-[#d8f3dc] px-2.5 py-0.5 text-[11px] font-black text-[#1b5e3b]">
                            {toPersianDigits(activeServices.length)} خدمت
                          </span>
                        </div>

                        <ul className="space-y-3">
                          <AnimatePresence initial={false}>
                            {activeServices.map((service) => (
                              <motion.li
                                key={service.providerServiceId}
                                layout
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ServiceCard
                                  service={service}
                                  onEdit={() => openEditor({ kind: "edit", service })}
                                  onDelete={() => setDeleteTarget(service)}
                                />
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      </>
                    )}

                    {removedServices.length > 0 ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRemoved((value) => !value)}
                          aria-expanded={showRemoved}
                          className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-[12.5px] font-bold text-muted-foreground"
                        >
                          خدمات حذف‌شده ({toPersianDigits(removedServices.length)})
                          <ChevronDown
                            className={cn("size-4 transition-transform", showRemoved && "rotate-180")}
                          />
                        </button>
                        {showRemoved ? (
                          <div className="mt-2 space-y-2">
                            <p className="px-1 text-[11px] leading-5 text-muted-foreground">
                              این خدمات به کشاورزان نمایش داده نمی‌شوند.
                            </p>
                            {removedServices.map((service) => (
                              <ServiceCard key={service.providerServiceId} service={service} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : tab === "area" ? (
                  <WorkAreaPanel
                    configured={workAreaConfigured}
                    center={workCenter}
                    radiusKm={workRadiusKm}
                    dirty={workAreaDirty}
                    saving={savingWorkArea}
                    onCenterChange={setWorkCenter}
                    onRadiusChange={setWorkRadiusKm}
                    onSave={() => void handleSaveWorkArea()}
                  />
                ) : (
                  <ProviderGalleryManager />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <ServiceEditorSheet
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mode={editorMode}
          formKey={editorKey}
          catalog={catalog}
          offered={offered}
          onSubmit={handleSubmitService}
        />

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="حذف خدمت"
          description={
            deleteTarget
              ? `«${deleteTarget.serviceName}» از نتایج جستجو حذف می‌شود و امکان افزودن دوباره آن وجود ندارد.`
              : ""
          }
          confirmLabel="حذف"
          variant="destructive"
          loading={deleting}
          onConfirm={() => void handleDeleteService()}
        />
      </PageContainer>
    </MotionConfig>
  );
}

export default function ProviderServicesPage() {
  return (
    <Suspense>
      <ProviderServicesContent />
    </Suspense>
  );
}
