"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  Sparkles,
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
import {
  fetchRequestCandidates,
  sendAppRequestToProviders,
  type AppCandidateRequestContext,
  type AppCandidateState,
  type AppRequestCandidate,
  type AppSendRequestResult,
} from "@/lib/api/app-requests";
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

/** Server cap on providers per send. */
const MAX_PROVIDERS_PER_SEND = 30;

const LIST_ITEM_SPRING = { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.9 };

const OPEN_STATUSES = new Set(["awaiting_send", "pending_provider"]);

const CARD_STATE: Record<AppCandidateState, ProviderResultState> = {
  available: "idle",
  unavailable: "unavailable",
  sent: "sent",
  rejected: "rejected",
  accepted: "accepted",
  removed: "removed",
};

/** Accepted first, then waiting, then selectable, then closed-out ones. */
const STATE_RANK: Record<AppCandidateState, number> = {
  accepted: 0,
  sent: 1,
  available: 2,
  rejected: 3,
  unavailable: 4,
  removed: 5,
};

function SearchSummary({ context }: { context: AppCandidateRequestContext }) {
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
          جستجوی جدید
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

function RequestBanner({
  context,
  candidates,
}: {
  context: AppCandidateRequestContext;
  candidates: AppRequestCandidate[];
}) {
  const href = `/users/requests/${context.requestId}`;

  if (context.status === "in_progress" || context.status === "completed") {
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
            {context.assignedProviderName ?? "خدمات‌دهنده"} کار را پذیرفت. جزئیات و تماس را ببینید.
          </span>
        </span>
        <ArrowLeft className="size-5 shrink-0 text-[#2f6a35]" />
      </Link>
    );
  }

  if (context.status === "cancelled") {
    return (
      <Link href={href} className="flex items-center gap-3 rounded-[22px] bg-white/70 p-4 ring-1 ring-[#efe0c8]">
        <span className="text-[12.5px] font-bold text-[#8a6a48]">این درخواست لغو شده است.</span>
        <ArrowLeft className="ms-auto size-4 text-[#a08463]" />
      </Link>
    );
  }

  if (context.status === "awaiting_send") {
    const available = candidates.filter((item) => item.state === "available").length;
    return (
      <div className="flex items-center gap-3 rounded-[22px] bg-[linear-gradient(150deg,#fff6e6_0%,#ffffff_85%)] p-4 ring-1 ring-[#f3d3a8]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0a94f] text-white">
          <Sparkles className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black text-[#5c3410]">
            {toPersianDigits(available)} خدمات‌دهنده آماده دریافت درخواست
          </span>
          <span className="block text-[11.5px] leading-5 text-[#8a6a48]">
            این جستجو در «درخواست‌های من» ذخیره شد. انتخاب کنید و درخواست را بفرستید.
          </span>
        </span>
      </div>
    );
  }

  const waiting = candidates.filter((item) => item.state === "sent").length;
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[22px] bg-[linear-gradient(150deg,#fff1df_0%,#ffffff_85%)] p-4 ring-1 ring-[#f3d3a8]">
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8892c] text-white">
        <Clock3 className="size-5" />
        <span className="absolute -left-0.5 -top-0.5 size-3 animate-ping rounded-full bg-[#e8892c]/60" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-[#5c3410]">
          منتظر پاسخ {toPersianDigits(waiting)} خدمات‌دهنده
        </span>
        <span className="block text-[11.5px] text-[#8a6a48]">
          اولین کسی که قبول کند کار را انجام می‌دهد. پیگیری درخواست
        </span>
      </span>
      <ArrowLeft className="size-5 shrink-0 text-[#b9531f]" />
    </Link>
  );
}

function describeSkipped(result: AppSendRequestResult): string | undefined {
  if (result.skipped.length === 0) return undefined;
  const notEligible = result.skipped.filter((item) => item.reason === "not_eligible").length;
  const alreadySent = result.skipped.length - notEligible;
  const parts: string[] = [];
  if (notEligible > 0) parts.push(`${toPersianDigits(notEligible)} نفر دیگر در دسترس نیستند`);
  if (alreadySent > 0) parts.push(`${toPersianDigits(alreadySent)} نفر قبلاً درخواست را گرفته‌اند`);
  return `${parts.join(" و ")}؛ برای آن‌ها ارسال نشد.`;
}

export default function SearchResultsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId") ?? "";
  const user = useAuthStore((state) => state.user);

  const [context, setContext] = useState<AppCandidateRequestContext | null>(null);
  const [candidates, setCandidates] = useState<AppRequestCandidate[]>([]);
  // A provider profile can send the farmer back here with ?select=<providerId>.
  const [selected, setSelected] = useState<Set<string>>(() => {
    const preselect = searchParams.get("select");
    return new Set(preselect ? [preselect] : []);
  });
  const [sort, setSort] = useState<SortKey>("price");
  const [loading, setLoading] = useState(() => Boolean(requestId));
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!requestId || !user) return;
    const controller = new AbortController();
    void fetchRequestCandidates(requestId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setContext(result.request);
        setCandidates(result.candidates);
        setFailed(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setFailed(true);
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری خدمات‌دهندگان ناموفق بود");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestId, user, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const isOpen = context ? OPEN_STATUSES.has(context.status) : false;
  const landArea = useMemo<LandArea | null>(() => {
    const squareMeters = Number(context?.landAreaSquareMeters);
    if (!context || !Number.isFinite(squareMeters) || squareMeters <= 0) return null;
    const area = formatAreaSqm(squareMeters);
    return { squareMeters, label: `${area.primary} ${area.primaryUnit}` };
  }, [context]);

  const visibleResults = useMemo(() => {
    const valueOf = sort === "price" ? (item: AppRequestCandidate) => item.priceToman : (item: AppRequestCandidate) => item.distanceKm;
    return candidates
      .filter((item) => {
        if (item.state === "removed") return false;
        // Once the job is closed, only the providers who were part of it matter.
        if (!isOpen) return item.state !== "available" && item.state !== "unavailable";
        return true;
      })
      .sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || valueOf(a) - valueOf(b));
  }, [candidates, sort, isOpen]);

  const highlightsFor = useMemo(() => {
    const map = new Map<string, ProviderHighlight[]>();
    const comparable = visibleResults.filter((item) => item.state !== "unavailable");
    if (comparable.length < 2) return map;
    const minDistance = Math.min(...comparable.map((item) => item.distanceKm));
    const minPrice = Math.min(...comparable.map((item) => item.priceToman));
    for (const item of comparable) {
      const tags: ProviderHighlight[] = [];
      if (item.distanceKm === minDistance) tags.push("nearest");
      if (item.priceToman === minPrice) tags.push("cheapest");
      if (tags.length) map.set(item.providerId, tags);
    }
    return map;
  }, [visibleResults]);

  const selectableIds = isOpen
    ? visibleResults.filter((item) => item.state === "available").map((item) => item.providerId)
    : [];
  const selectedIds = selectableIds.filter((id) => selected.has(id));
  const allSelected =
    selectableIds.length > 0 && selectedIds.length === Math.min(selectableIds.length, MAX_PROVIDERS_PER_SEND);

  const toggleSelect = (providerId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else if (next.size >= MAX_PROVIDERS_PER_SEND) {
        toast.info(`حداکثر ${toPersianDigits(MAX_PROVIDERS_PER_SEND)} خدمات‌دهنده در هر ارسال`);
        return current;
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds.slice(0, MAX_PROVIDERS_PER_SEND)));
  };

  const handleSend = async () => {
    if (!requestId || selectedIds.length === 0) return;

    setSending(true);
    try {
      const result = await sendAppRequestToProviders({ requestId, providerIds: selectedIds });
      setSelected(new Set());
      if (result.sent.length === 0) {
        toast.error("درخواست برای هیچ‌کس ارسال نشد", describeSkipped(result));
      } else if (result.skipped.length > 0) {
        toast.warning(`درخواست برای ${toPersianDigits(result.sent.length)} خدمات‌دهنده ارسال شد`, describeSkipped(result));
      } else {
        toast.success(
          "درخواست ارسال شد",
          `برای ${toPersianDigits(result.sent.length)} خدمات‌دهنده. با اولین پذیرش به شما اطلاع می‌دهیم.`,
        );
      }
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "ارسال درخواست ناموفق بود");
    } finally {
      setSending(false);
      reload();
    }
  };

  if (!user) return null;

  const backHref = context ? `/users/requests/${context.requestId}` : "/users/requests";
  const resultsFrom = `${pathname}?${new URLSearchParams({ requestId }).toString()}`;

  const emptyCard = (title: string, hint: string) => (
    <div className="flex flex-col items-center rounded-[28px] bg-white px-6 py-9 text-center shadow-[0_18px_40px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]">
      <span className="flex size-16 items-center justify-center rounded-[22px] bg-[#fdebd3] text-[#b9531f]">
        <SearchX className="size-8" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-[16px] font-black text-[#3b2410]">{title}</h2>
      <p className="mt-2 max-w-72 text-[12px] leading-6 text-[#8a6a48]">{hint}</p>
      <Link
        href={context ? `/users/search?landId=${encodeURIComponent(context.landId)}` : "/users/search"}
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#b9531f] px-6 text-[14px] font-black text-white"
      >
        جستجوی جدید
        <ArrowLeft className="size-4" />
      </Link>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          title="خدمات‌دهندگان پیدا شده"
          subtitle={loading ? "در حال یافتن بهترین گزینه‌ها برای زمین شما" : undefined}
          backHref={backHref}
        >
          {context ? <SearchSummary context={context} /> : null}
        </ConsumerPageHero>

        <div className="relative z-10 -mt-4 space-y-3 px-4 pt-1">
          {!requestId ? (
            emptyCard("درخواستی انتخاب نشده", "از صفحه جستجو یا «درخواست‌های من» یک درخواست را باز کنید.")
          ) : loading ? (
            <SearchLoading />
          ) : failed && !context ? (
            <div className="flex items-center gap-3 rounded-[22px] bg-[#fdebd3] p-4 ring-1 ring-[#f3d3a8]">
              <RefreshCw className="size-5 shrink-0 text-[#b9531f]" />
              <p className="min-w-0 flex-1 text-[12px] leading-5 text-[#6b4210]">بارگذاری خدمات‌دهندگان ناموفق بود.</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  reload();
                }}
                className="shrink-0 rounded-full bg-[#b9531f] px-3.5 py-2 text-[11.5px] font-black text-white"
              >
                تلاش دوباره
              </button>
            </div>
          ) : !context ? (
            emptyCard("درخواست پیدا نشد", "ممکن است این درخواست حذف شده باشد.")
          ) : (
            <>
              <RequestBanner context={context} candidates={candidates} />

              {visibleResults.length === 0 ? (
                isOpen ? (
                  emptyCard(
                    "فعلاً خدمات‌دهنده‌ای در دسترس نیست",
                    "خدمات‌دهندگانی که قبلاً پیدا شده بودند الان فعال نیستند. کمی بعد دوباره سر بزنید یا جستجوی جدیدی انجام دهید.",
                  )
                ) : null
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <p className="text-[14px] font-black text-[#3b2410]">
                      {toPersianDigits(visibleResults.length)} خدمات‌دهنده
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
                    {visibleResults.map((item) => (
                      <motion.li key={item.providerId} layout transition={LIST_ITEM_SPRING}>
                        <ProviderResultCard
                          displayName={item.name}
                          image={item.image}
                          distanceKm={item.distanceKm}
                          price={item.priceToman}
                          pricingUnit={item.pricingUnit}
                          state={CARD_STATE[item.state]}
                          profileHref={`/users/providers/${encodeURIComponent(item.providerId)}?from=${encodeURIComponent(resultsFrom)}`}
                          selected={selected.has(item.providerId)}
                          onToggleSelect={isOpen ? () => toggleSelect(item.providerId) : undefined}
                          highlights={highlightsFor.get(item.providerId)}
                          landArea={landArea}
                          declinedBefore={item.declinedBefore}
                          sentElsewhere={item.sentInOtherRequest}
                          phone={item.phone}
                        />
                      </motion.li>
                    ))}
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

              {selectedIds.length === 0 ? (
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
