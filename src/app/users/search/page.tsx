"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { ArrowLeft, LandPlot, LoaderCircle, Plus, Search, ShieldCheck } from "lucide-react";

import { ConsumerPageHero } from "@/components/consumer-panel/consumer-hero";
import { DatePickerStep } from "@/components/consumer-panel/search/date-picker-step";
import { LandPicker } from "@/components/consumer-panel/search/land-picker";
import { SearchStep } from "@/components/consumer-panel/search/search-step";
import { ServicePicker, type CatalogTree } from "@/components/consumer-panel/search/service-picker";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fetchAppCatalogTree } from "@/lib/api/app-catalog";
import { fetchAppLands, mapAppLandToUi } from "@/lib/api/app-lands";
import { createAppServiceSearch } from "@/lib/api/app-search";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";
import { formatPersianIsoChip } from "@/lib/utils/jalali";
import { searchFormSchema } from "@/lib/validators/search";
import { useAuthStore } from "@/stores/auth-store";
import type { Land } from "@/types";

type StepKey = "land" | "service" | "dates" | "note";

/** Matches the server's limit on the note forwarded to providers. */
const MAX_NOTE_LENGTH = 1500;

const FIELD_STEP: Record<string, StepKey> = {
  landId: "land",
  categoryId: "service",
  serviceId: "service",
  scheduledDates: "dates",
};

function ConsumerSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [lands, setLands] = useState<Land[]>([]);
  const [catalog, setCatalog] = useState<CatalogTree>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Land cards link here with ?landId= to preselect the land.
  const [landId, setLandId] = useState(() => searchParams.get("landId") ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openStep, setOpenStep] = useState<StepKey | null>("land");

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    void Promise.all([fetchAppLands({ limit: 50, signal: controller.signal }), fetchAppCatalogTree(controller.signal)])
      .then(([landsResult, catalogTree]) => {
        if (controller.signal.aborted) return;
        const nextLands = landsResult.items.map((land) => mapAppLandToUi(land, user.id));
        setLands(nextLands);
        setCatalog(catalogTree);

        // Keep a valid preselection, or auto-pick when there is only one land.
        setLandId((current) => {
          if (nextLands.some((land) => land.id === current)) return current;
          return nextLands.length === 1 ? (nextLands[0]?.id ?? "") : "";
        });
        const hasLand = nextLands.length === 1 || nextLands.some((land) => land.id === searchParams.get("landId"));
        setOpenStep(hasLand ? "service" : "land");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری اطلاعات جستجو ناموفق بود");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user, searchParams]);

  const selectedLand = lands.find((land) => land.id === landId);
  const selectedService = catalog
    .find((category) => category.categoryId === categoryId)
    ?.services.find((service) => service.serviceId === serviceId);
  const completed = [Boolean(selectedLand), Boolean(selectedService), scheduledDates.length > 0].filter(Boolean).length;

  const clearError = (...fields: string[]) => {
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
  };

  const toggleStep = (step: StepKey) => setOpenStep((current) => (current === step ? null : step));

  const handleSearch = async () => {
    if (!user) return;

    const parsed = searchFormSchema.safeParse({ landId, categoryId, serviceId, scheduledDates });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstStep = (["landId", "serviceId", "categoryId", "scheduledDates"] as const).find((key) => fieldErrors[key]);
      if (firstStep) setOpenStep(FIELD_STEP[firstStep] ?? null);
      return;
    }

    setErrors({});
    setSearching(true);
    try {
      const search = await createAppServiceSearch({
        categoryId: parsed.data.categoryId,
        consumerNote: note.trim() || null,
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
      setSearching(false);
    }
  };

  if (!user) return null;

  const landArea = selectedLand ? formatAreaSqm(selectedLand.areaSqm) : null;
  const sortedDates = [...scheduledDates].sort();
  const datesSummary =
    sortedDates.length === 0
      ? null
      : sortedDates.length <= 2
        ? sortedDates.map(formatPersianIsoChip).join("، ")
        : `${formatPersianIsoChip(sortedDates[0] ?? "")} و ${toPersianDigits(sortedDates.length - 1)} روز دیگر`;

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          title="جستجوی خدمات"
          subtitle="در سه قدم، خدمات‌دهندگان نزدیک زمینتان را پیدا کنید."
          backHref="/users/home"
        >
          {!loading && lands.length > 0 ? (
            <div className="mt-5 rounded-2xl bg-white/45 p-3 ring-1 ring-white/70 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11.5px] font-bold text-[#6b4a26]">
                <span>{completed === 3 ? "همه چیز آماده است" : "مراحل جستجو"}</span>
                <span className="tabular-nums">
                  {toPersianDigits(completed)} از {toPersianDigits(3)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-colors duration-500",
                      index < completed ? "bg-[#b9531f]" : "bg-white/70",
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-3 px-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-44 rounded-[26px] bg-white/70" />
              <Skeleton className="h-20 rounded-[26px] bg-white/70" />
              <Skeleton className="h-20 rounded-[26px] bg-white/70" />
            </div>
          ) : lands.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center rounded-[28px] bg-white px-6 py-9 text-center shadow-[0_18px_40px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]"
            >
              <span className="flex size-18 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ffe2ad] to-[#f0a94f] p-4 text-[#7a4513]">
                <LandPlot className="size-9" strokeWidth={1.5} />
              </span>
              <h2 className="mt-4 text-[16px] font-black text-[#3b2410]">ابتدا زمین خود را ثبت کنید</h2>
              <p className="mt-1.5 max-w-72 text-[12px] leading-6 text-[#8a6a48]">
                جستجو بر اساس موقعیت زمین انجام می‌شود تا نزدیک‌ترین خدمات‌دهندگان را پیدا کنیم.
              </p>
              <Link
                href="/users/lands/new"
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#b9531f] px-6 text-[14px] font-black text-white"
              >
                <Plus className="size-5" strokeWidth={2.5} />
                ثبت زمین
              </Link>
            </motion.div>
          ) : (
            <>
              <SearchStep
                index={1}
                title="کدام زمین؟"
                hint="محل انجام کار را انتخاب کنید"
                summary={selectedLand && landArea ? `${selectedLand.title} · ${landArea.primary} ${landArea.primaryUnit}` : null}
                done={Boolean(selectedLand)}
                open={openStep === "land"}
                error={errors.landId}
                onToggle={() => toggleStep("land")}
              >
                <LandPicker
                  lands={lands}
                  value={landId}
                  onChange={(id) => {
                    setLandId(id);
                    clearError("landId");
                    setOpenStep(!selectedService ? "service" : scheduledDates.length === 0 ? "dates" : null);
                  }}
                />
              </SearchStep>

              <SearchStep
                index={2}
                title="چه خدمتی لازم دارید؟"
                hint="خدمت را جستجو یا از فهرست انتخاب کنید"
                summary={selectedService?.name ?? null}
                done={Boolean(selectedService)}
                open={openStep === "service"}
                error={errors.serviceId ?? errors.categoryId}
                onToggle={() => toggleStep("service")}
              >
                <ServicePicker
                  catalog={catalog}
                  value={serviceId}
                  onChange={(nextService, nextCategory) => {
                    setServiceId(nextService);
                    setCategoryId(nextCategory);
                    clearError("serviceId", "categoryId");
                    setOpenStep(scheduledDates.length > 0 ? null : "dates");
                  }}
                />
              </SearchStep>

              <SearchStep
                index={3}
                title="چه زمانی؟"
                hint="یک یا چند روز مناسب انتخاب کنید"
                summary={datesSummary}
                done={scheduledDates.length > 0}
                open={openStep === "dates"}
                error={errors.scheduledDates}
                onToggle={() => toggleStep("dates")}
              >
                <DatePickerStep
                  value={scheduledDates}
                  onChange={(dates) => {
                    setScheduledDates(dates);
                    if (dates.length > 0) clearError("scheduledDates");
                  }}
                />
              </SearchStep>

              <SearchStep
                index={4}
                title="توضیح برای خدمات‌دهنده"
                hint="نوع محصول، شرایط زمین یا مسیر دسترسی"
                summary={note.trim() ? note.trim() : null}
                done={Boolean(note.trim())}
                open={openStep === "note"}
                optional
                onToggle={() => toggleStep("note")}
              >
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="مثلاً: زمین گندم آبی است و ورودی از جاده خاکی ضلع شمالی است."
                  className="min-h-28 rounded-2xl border-0 bg-[#fcf7ee] text-[13px] leading-6 ring-1 ring-[#efe0c8] focus-visible:ring-2 focus-visible:ring-[#e3b97f]"
                />
                <p className="mt-1.5 text-[10.5px] text-[#a08463]">
                  این توضیح همراه درخواست برای خدمات‌دهندگان ارسال می‌شود.
                </p>
              </SearchStep>

              <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[10.5px] leading-5 text-[#a08463]">
                <ShieldCheck className="size-3.5 shrink-0 text-[#4f9a55]" />
                شماره تماس شما فقط پس از قبول درخواست به خدمات‌دهنده نمایش داده می‌شود.
              </p>

              {/* Sticky offsets count from the container's padding edge (pb-32), so this lands just above the dock. */}
              <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)-2.5rem)] z-20 pt-2">
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  disabled={searching}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[22px] py-3 pe-3 ps-5 text-right text-white transition active:scale-[0.98] disabled:opacity-80",
                    completed === 3
                      ? "bg-[#b9531f] shadow-[0_18px_36px_-14px_rgba(185,83,31,0.95)]"
                      : "bg-[#5c4120] shadow-[0_18px_36px_-16px_rgba(59,36,16,0.7)]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-black">
                      {searching ? "در حال یافتن خدمات‌دهندگان…" : "یافتن خدمات‌دهندگان"}
                    </span>
                    <span className="block truncate text-[11px] text-white/75">
                      {selectedService && selectedLand
                        ? `${selectedService.name} برای ${selectedLand.title}`
                        : `${toPersianDigits(3 - completed)} مرحله باقی مانده`}
                    </span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/95 text-[#b9531f]">
                    {searching ? (
                      <LoaderCircle className="size-5 animate-spin" />
                    ) : completed === 3 ? (
                      <ArrowLeft className="size-5" strokeWidth={2.25} />
                    ) : (
                      <Search className="size-5" />
                    )}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}

export default function ConsumerSearchPage() {
  return (
    <Suspense>
      <ConsumerSearchContent />
    </Suspense>
  );
}
