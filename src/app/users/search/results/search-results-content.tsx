"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  LandPlot,
  LoaderCircle,
  RefreshCw,
  SearchX,
  Send,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

import { ConsumerPageHero } from "@/components/consumer-panel/consumer-hero";
import {
  ProviderResultCard,
  type LandArea,
  type ProviderHighlight,
  type ProviderResultState,
} from "@/components/consumer-panel/provider-result-card";
import { SearchLoading } from "@/components/consumer-panel/search-loading";
import { PageContainer } from "@/components/layout/page-container";
import { fetchAppLand } from "@/lib/api/app-lands";
import {
  addAppRequestProviders,
  createAppServiceRequest,
  fetchConsumerRequest,
  type AppConsumerRequestDetail,
} from "@/lib/api/app-requests";
import { fetchAppSearchProviders, type AppSearchContext, type AppSearchProvider } from "@/lib/api/app-search";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatAreaSqm, toPersianDigits } from "@/lib/utils/format";
import { formatPersianIsoChip } from "@/lib/utils/jalali";
import { useAuthStore } from "@/stores/auth-store";

type SortKey = "price" | "distance";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "ارزان‌ترین" },
  { key: "distance", label: "نزدیک‌ترین" },
];

/** Server cap on providers per request. */
const MAX_PROVIDERS_PER_REQUEST = 30;

const LIST_ITEM_SPRING = { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.9 };

function getApiProviderResultState(
  provider: AppSearchProvider,
  sentLocally: ReadonlySet<string>,
  requestDetail: AppConsumerRequestDetail | null,
): ProviderResultState {
  if (requestDetail) {
    if (requestDetail.status === "in_progress" || requestDetail.status === "completed") {
      return requestDetail.assignedProviderId === provider.providerId ? "accepted" : "removed";
    }
    if (requestDetail.status === "cancelled") return "removed";

    const link = requestDetail.providers.find((item) => item.providerId === provider.providerId);
    if (link) {
      if (link.status === "sent") return "sent";
      if (link.status === "rejected") return "rejected";
      if (link.status === "removed") return "removed";
      if (link.status === "accepted") return "accepted";
    }
  }

  if (sentLocally.has(provider.providerId)) return "sent";
  return "idle";
}

function SearchSummary({ context }: { context: AppSearchContext }) {
  const dates = [...context.dates].sort();
  return (
    <div className="mt-5 rounded-[22px] bg-white/55 p-4 ring-1 ring-white/80 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#a0561a]">
            <Wrench className="size-3.5" />
            {context.categoryName}
          </p>
          <p className="mt-0.5 truncate text-[17px] font-black">{context.serviceName}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-[12px] text-[#6b4a26]">
            <LandPlot className="size-3.5 shrink-0" />
            {context.landTitle}
          </p>
        </div>
        <Link
          href={`/users/search?landId=${encodeURIComponent(context.landId)}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#a0561a] ring-1 ring-white"
        >
          <SlidersHorizontal className="size-3.5" />
          تغییر
        </Link>
      </div>
      {dates.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <CalendarDays className="size-3.5 text-[#a0561a]" />
          {dates.slice(0, 3).map((date) => (
            <span key={date} className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-[#6b4a26]">
              {formatPersianIsoChip(date)}
            </span>
          ))}
          {dates.length > 3 ? (
            <span className="text-[11px] font-bold text-[#8a6a48]">+{toPersianDigits(dates.length - 3)}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RequestBanner({ detail }: { detail: AppConsumerRequestDetail }) {
  const href = `/users/requests/${detail.requestId}`;

  if (detail.status === "in_progress" || detail.status === "completed") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-[22px] bg-[linear-gradient(150deg,#e1f0dc_0%,#ffffff_85%)] p-4 ring-1 ring-[#bfe0b4]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#4f9a55] text-white">
          <BadgeCheck className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black text-[#1f4d26]">خدمات‌دهنده پیدا شد!</span>
          <span className="block truncate text-[11.5px] text-[#3f6b43]">
            {detail.assignedProviderName ?? "خدمات‌دهنده"} کار را پذیرفت. جزئیات و تماس را ببینید.
          </span>
        </span>
        <ArrowLeft className="size-5 shrink-0 text-[#2f6a35]" />
      </Link>
    );
  }

  if (detail.status === "cancelled") {
    return (
      <Link href={href} className="flex items-center gap-3 rounded-[22px] bg-white/70 p-4 ring-1 ring-[#efe0c8]">
        <span className="text-[12.5px] font-bold text-[#8a6a48]">این درخواست لغو شده است.</span>
        <ArrowLeft className="ms-auto size-4 text-[#a08463]" />
      </Link>
    );
  }

  const waiting = detail.providers.filter((item) => item.status === "sent").length;
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[22px] bg-[linear-gradient(150deg,#fff1df_0%,#ffffff_85%)] p-4 ring-1 ring-[#f3d3a8]">
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8892c] text-white">
        <Clock3 className="size-5" />
        <span className="absolute -left-0.5 -top-0.5 size-3 animate-ping rounded-full bg-[#e8892c]/60" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-[#5c3410]">
          درخواست برای {toPersianDigits(waiting)} خدمات‌دهنده ارسال شد
        </span>
        <span className="block text-[11.5px] text-[#8a6a48]">
          اولین کسی که قبول کند کار را انجام می‌دهد. پیگیری درخواست
        </span>
      </span>
      <ArrowLeft className="size-5 shrink-0 text-[#b9531f]" />
    </Link>
  );
}

export default function SearchResultsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId") ?? "";
  const user = useAuthStore((state) => state.user);

  const [searchContext, setSearchContext] = useState<AppSearchContext | null>(null);
  const [providers, setProviders] = useState<AppSearchProvider[]>([]);
  const [requestId, setRequestId] = useState<string | null>(() => searchParams.get("requestId"));
  const [requestDetail, setRequestDetail] = useState<AppConsumerRequestDetail | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [sentLocally, setSentLocally] = useState<Set<string>>(() => new Set());
  // A provider profile can send the farmer back here with ?select=<providerId>.
  const [selected, setSelected] = useState<Set<string>>(() => {
    const preselect = searchParams.get("select");
    return new Set(preselect ? [preselect] : []);
  });
  const [sort, setSort] = useState<SortKey>("price");
  const [loading, setLoading] = useState(() => Boolean(searchId));
  const [sending, setSending] = useState(false);
  const [landArea, setLandArea] = useState<LandArea | null>(null);

  const loadProviders = useCallback(
    (signal: AbortSignal) => {
      if (!searchId) return;

      void fetchAppSearchProviders({ searchId, sort: "priceAsc", limit: 50, signal })
        .then((result) => {
          if (signal.aborted) return;
          setSearchContext(result.search);
          setProviders(result.items);
        })
        .catch((cause: unknown) => {
          if (signal.aborted) return;
          setSearchContext(null);
          setProviders([]);
          toast.error(isApiClientError(cause) ? cause.message : "بارگذاری نتایج جستجو ناموفق بود");
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [searchId],
  );

  useEffect(() => {
    if (!searchId) return;
    const controller = new AbortController();
    loadProviders(controller.signal);
    return () => controller.abort();
  }, [loadProviders, searchId]);

  const handleRetrySearch = useCallback(() => {
    setLoading(true);
    loadProviders(new AbortController().signal);
  }, [loadProviders]);

  useEffect(() => {
    if (!requestId) return;
    const controller = new AbortController();
    void fetchConsumerRequest(requestId, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) setRequestDetail(detail);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRequestDetail(null);
      });
    return () => controller.abort();
  }, [requestId, detailVersion]);

  const landId = searchContext?.landId;
  useEffect(() => {
    if (!landId) return;
    const controller = new AbortController();
    void fetchAppLand(landId, controller.signal)
      .then((land) => {
        if (controller.signal.aborted) return;
        const squareMeters = Number(land.areaSquareMeters);
        const area = formatAreaSqm(squareMeters);
        setLandArea({ squareMeters, label: `${area.primary} ${area.primaryUnit}` });
      })
      .catch(() => undefined); // The estimate is optional.
    return () => controller.abort();
  }, [landId]);

  const activeRequestDetail = requestId ? requestDetail : null;

  const visibleResults = useMemo(() => {
    const valueOf = sort === "price" ? (p: AppSearchProvider) => p.priceToman : (p: AppSearchProvider) => p.distanceKm;
    return providers
      .map((provider) => ({ provider, state: getApiProviderResultState(provider, sentLocally, activeRequestDetail) }))
      .filter((item) => item.state !== "removed")
      .sort((a, b) => {
        const rank = (state: ProviderResultState) => (state === "accepted" ? 0 : state === "sent" ? 1 : 2);
        if (rank(a.state) !== rank(b.state)) return rank(a.state) - rank(b.state);
        return valueOf(a.provider) - valueOf(b.provider);
      });
  }, [providers, sort, activeRequestDetail, sentLocally]);

  const highlightsFor = useMemo(() => {
    const map = new Map<string, ProviderHighlight[]>();
    if (visibleResults.length < 2) return map;
    const minDistance = Math.min(...visibleResults.map((item) => item.provider.distanceKm));
    const minPrice = Math.min(...visibleResults.map((item) => item.provider.priceToman));
    for (const { provider } of visibleResults) {
      const tags: ProviderHighlight[] = [];
      if (provider.distanceKm === minDistance) tags.push("nearest");
      if (provider.priceToman === minPrice) tags.push("cheapest");
      if (tags.length) map.set(provider.providerId, tags);
    }
    return map;
  }, [visibleResults]);

  const selectableIds = visibleResults.filter((item) => item.state === "idle").map((item) => item.provider.providerId);
  const selectedIds = selectableIds.filter((id) => selected.has(id));
  const allSelected = selectableIds.length > 0 && selectedIds.length === Math.min(selectableIds.length, MAX_PROVIDERS_PER_REQUEST);

  const toggleSelect = (providerId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else if (next.size >= MAX_PROVIDERS_PER_REQUEST) {
        toast.info(`حداکثر ${toPersianDigits(MAX_PROVIDERS_PER_REQUEST)} خدمات‌دهنده در هر درخواست`);
        return current;
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds.slice(0, MAX_PROVIDERS_PER_REQUEST)));
  };

  const handleSend = async () => {
    if (!searchId || selectedIds.length === 0) return;

    setSending(true);
    try {
      if (!requestId) {
        const created = await createAppServiceRequest({ searchId, providerIds: selectedIds });
        setRequestId(created.requestId);
        // Keep the request in the URL so a refresh or back-navigation restores it.
        router.replace(`${pathname}?${new URLSearchParams({ searchId, requestId: created.requestId }).toString()}`, {
          scroll: false,
        });
      } else {
        await addAppRequestProviders({ requestId, providerIds: selectedIds });
        setDetailVersion((version) => version + 1);
      }

      setSentLocally((current) => new Set([...current, ...selectedIds]));
      setSelected(new Set());
      toast.success(
        "درخواست ارسال شد",
        `برای ${toPersianDigits(selectedIds.length)} خدمات‌دهنده. با اولین پذیرش به شما اطلاع می‌دهیم.`,
      );
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "ارسال درخواست ناموفق بود");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  const backHref = searchContext ? `/users/search?landId=${encodeURIComponent(searchContext.landId)}` : "/users/search";
  const resultsFrom = `${pathname}?${new URLSearchParams({ searchId, ...(requestId ? { requestId } : {}) }).toString()}`;

  const emptyCard = (
    <div className="flex flex-col items-center rounded-[28px] bg-white px-6 py-9 text-center shadow-[0_18px_40px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]">
      <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fdebd3] text-[#b9531f]">
        <SearchX className="size-8" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-[16px] font-black text-[#3b2410]">خدمات‌دهنده‌ای در این محدوده پیدا نشد</h2>
      <ul className="mt-3 space-y-1 text-[12px] leading-6 text-[#8a6a48]">
        <li>• روزهای بیشتری برای انجام کار انتخاب کنید</li>
        <li>• خدمت مشابه دیگری را امتحان کنید</li>
        <li>• کمی بعد دوباره جستجو کنید</li>
      </ul>
      <Link
        href={backHref}
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#b9531f] px-6 text-[14px] font-black text-white"
      >
        جستجوی دوباره
        <ArrowLeft className="size-4" />
      </Link>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          title="نتایج جستجو"
          subtitle={loading ? "در حال یافتن بهترین گزینه‌ها برای زمین شما" : undefined}
          backHref={backHref}
        >
          {searchContext ? <SearchSummary context={searchContext} /> : null}
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-3 px-4 pt-1">
          {!searchId ? (
            emptyCard
          ) : loading ? (
            <SearchLoading />
          ) : !searchContext && requestId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[22px] bg-[#fdebd3] p-4 ring-1 ring-[#f3d3a8]">
                <RefreshCw className="size-5 shrink-0 text-[#b9531f]" />
                <p className="min-w-0 flex-1 text-[12px] leading-5 text-[#6b4210]">
                  مهلت این جستجو تمام شده، اما درخواست شما همچنان فعال است.
                </p>
                <button
                  type="button"
                  onClick={handleRetrySearch}
                  className="shrink-0 rounded-full bg-[#b9531f] px-3.5 py-2 text-[11.5px] font-black text-white"
                >
                  تازه کردن
                </button>
              </div>
              {requestDetail ? <RequestBanner detail={requestDetail} /> : null}
            </div>
          ) : !searchContext ? (
            emptyCard
          ) : (
            <>
              {activeRequestDetail ? <RequestBanner detail={activeRequestDetail} /> : null}

              {visibleResults.length === 0 ? (
                emptyCard
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <p className="text-[14px] font-black text-[#3b2410]">
                      {toPersianDigits(visibleResults.length)} خدمات‌دهنده پیدا شد
                    </p>
                    <div className="flex gap-1" role="group" aria-label="مرتب‌سازی">
                      {SORTS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={sort === item.key}
                          onClick={() => setSort(item.key)}
                          className={cn(
                            "h-8 rounded-full px-3 text-[11.5px] font-bold transition-colors",
                            sort === item.key
                              ? "bg-[#3b2410] text-[#fff3dc]"
                              : "bg-white text-[#6b4a26] ring-1 ring-[#efe0c8]",
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectableIds.length > 1 ? (
                    <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3.5 py-2.5 ring-1 ring-[#efe0c8]">
                      <p className="text-[11.5px] leading-5 text-[#8a6a48]">
                        برای پاسخ سریع‌تر، چند خدمات‌دهنده را انتخاب کنید.
                      </p>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="shrink-0 text-[12px] font-black text-[#b9531f]"
                      >
                        {allSelected ? "لغو انتخاب" : "انتخاب همه"}
                      </button>
                    </div>
                  ) : null}

                  <ul className="space-y-3">
                    {visibleResults.map(({ provider, state }) => {
                      const link = activeRequestDetail?.providers.find((item) => item.providerId === provider.providerId);
                      return (
                        <motion.li key={provider.providerId} layout transition={LIST_ITEM_SPRING}>
                          <ProviderResultCard
                            displayName={provider.name ?? "خدمات‌دهنده"}
                            image={provider.image}
                            distanceKm={provider.distanceKm}
                            price={provider.priceToman}
                            pricingUnit={provider.pricingUnit}
                            state={state}
                            profileHref={`/users/providers/${encodeURIComponent(provider.providerId)}?from=${encodeURIComponent(resultsFrom)}`}
                            selected={selected.has(provider.providerId)}
                            onToggleSelect={() => toggleSelect(provider.providerId)}
                            highlights={highlightsFor.get(provider.providerId)}
                            landArea={landArea}
                            declinedBefore={provider.previousStatus === "rejected"}
                            phone={state === "accepted" ? link?.phone : null}
                          />
                        </motion.li>
                      );
                    })}
                  </ul>
                </>
              )}

              <AnimatePresence>
                {selectedIds.length > 0 ? (
                  <motion.div
                    key="send-bar"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    // Sticky offsets count from the container's padding edge (pb-32), so this sits above the dock.
                    className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)-2.5rem)] z-20 pt-2"
                  >
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={sending}
                      className="flex w-full items-center gap-3 rounded-[22px] bg-[#b9531f] py-3 pe-3 ps-5 text-right text-white shadow-[0_18px_36px_-14px_rgba(185,83,31,0.95)] transition active:scale-[0.98] disabled:opacity-80"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-black">
                          {sending
                            ? "در حال ارسال…"
                            : `ارسال درخواست به ${toPersianDigits(selectedIds.length)} خدمات‌دهنده`}
                        </span>
                        <span className="block truncate text-[11px] text-white/75">
                          اولین کسی که قبول کند، کار را انجام می‌دهد
                        </span>
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#b9531f]">
                        {sending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}
                      </span>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {!activeRequestDetail && selectedIds.length === 0 && visibleResults.length > 0 ? (
                <Link
                  href="/users/requests"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl text-[12.5px] font-bold text-[#a0561a]"
                >
                  مشاهده همه درخواست‌های من
                  <ArrowLeft className="size-4" />
                </Link>
              ) : null}
            </>
          )}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}
