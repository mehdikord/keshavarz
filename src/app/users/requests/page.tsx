"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { BadgeCheck, Clock3, RotateCw, Search, Send, Tractor, UserPlus, XCircle } from "lucide-react";

import { CancelRequestSheet } from "@/components/consumer-panel/cancel-request-sheet";
import { ConsumerPageHero, HARVEST_GLASS_BUTTON } from "@/components/consumer-panel/consumer-hero";
import { ConsumerRequestCard } from "@/components/consumer-panel/consumer-request-card";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cancelConsumerRequest,
  fetchConsumerRequests,
  type AppConsumerRequestSummary,
  type AppRequestStatus,
} from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

const TABS: {
  key: AppRequestStatus;
  label: string;
  icon: typeof Clock3;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    key: "pending_provider",
    label: "در انتظار",
    icon: Clock3,
    emptyTitle: "درخواست در انتظاری ندارید",
    emptyDescription: "پس از جستجو و ارسال درخواست، اینجا وضعیت آن را می‌بینید.",
  },
  {
    key: "in_progress",
    label: "در حال انجام",
    icon: Tractor,
    emptyTitle: "کار فعالی ندارید",
    emptyDescription: "درخواست‌هایی که خدمات‌دهنده بپذیرد اینجا قرار می‌گیرند.",
  },
  {
    key: "completed",
    label: "انجام‌شده",
    icon: BadgeCheck,
    emptyTitle: "هنوز کاری تمام نشده",
    emptyDescription: "پس از پایان کار و تأیید شما، سابقه آن اینجا می‌ماند.",
  },
  {
    key: "cancelled",
    label: "لغوشده",
    icon: XCircle,
    emptyTitle: "درخواست لغوشده‌ای نیست",
    emptyDescription: "درخواست‌هایی که لغو شوند اینجا نمایش داده می‌شوند.",
  },
];

const STATUSES = TABS.map((tab) => tab.key);
type Grouped = Record<AppRequestStatus, AppConsumerRequestSummary[]>;
const EMPTY: Grouped = { pending_provider: [], in_progress: [], completed: [], cancelled: [] };

function parseTab(value: string | null): AppRequestStatus {
  return STATUSES.includes(value as AppRequestStatus) ? (value as AppRequestStatus) : "pending_provider";
}

function ConsumerRequestsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const user = useAuthStore((state) => state.user);

  const [grouped, setGrouped] = useState<Grouped>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AppConsumerRequestSummary | null>(null);
  const [sheetKey, setSheetKey] = useState(0);

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    const results = await Promise.all(
      STATUSES.map((status) => fetchConsumerRequests({ status, limit: 50, signal })),
    );
    return STATUSES.reduce<Grouped>((acc, status, index) => ({ ...acc, [status]: results[index]?.items ?? [] }), EMPTY);
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    loadAll(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setGrouped(next);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری درخواست‌ها ناموفق بود");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user, loadAll]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setGrouped(await loadAll());
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setRefreshing(false);
    }
  };

  const selectTab = (next: AppRequestStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "pending_provider") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return false;
    try {
      await cancelConsumerRequest(cancelTarget.requestId, { expectedVersion: cancelTarget.version, reason });
      toast.info("درخواست لغو شد");
      setCancelTarget(null);
      setGrouped(await loadAll());
      return true;
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "لغو درخواست ناموفق بود");
      return false;
    }
  };

  if (!user) return null;

  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0]!;
  const visible = grouped[tab];

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerPageHero
          title="درخواست‌های من"
          subtitle="وضعیت درخواست‌هایتان را دنبال کنید و با خدمات‌دهنده هماهنگ شوید."
          actions={
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing || loading}
              aria-label="به‌روزرسانی"
              className={cn(HARVEST_GLASS_BUTTON, "disabled:opacity-60")}
            >
              <RotateCw className={cn("size-5", refreshing && "animate-spin")} strokeWidth={1.9} />
            </button>
          }
        >
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: Clock3, label: "منتظر پاسخ", value: grouped.pending_provider.length },
              { icon: Tractor, label: "در حال انجام", value: grouped.in_progress.length },
              { icon: BadgeCheck, label: "انجام‌شده", value: grouped.completed.length },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl bg-white/45 px-3 py-2.5 ring-1 ring-white/70 backdrop-blur-md">
                  <dt className="flex items-center gap-1 truncate text-[10.5px] font-bold text-[#8a5a2b]">
                    <Icon className="size-3.5 shrink-0" />
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-[16px] font-black tabular-nums">{loading ? "…" : toPersianDigits(stat.value)}</dd>
                </div>
              );
            })}
          </dl>
        </ConsumerPageHero>

        <div className="sticky top-0 z-20 -mt-5 px-4 pb-3 pt-2">
          <div
            role="tablist"
            aria-label="وضعیت درخواست‌ها"
            className="grid grid-cols-4 gap-1 rounded-[20px] bg-white/90 p-1.5 shadow-[0_12px_30px_-16px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8] backdrop-blur-xl"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = item.key === tab;
              const count = grouped[item.key].length;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(item.key)}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] font-bold transition-colors",
                    active ? "text-white" : "text-[#8a6a48] hover:text-[#3b2410]",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="consumer-requests-tab"
                      className="absolute inset-0 rounded-[14px] bg-[#b9531f] shadow-[0_8px_18px_-10px_rgba(185,83,31,0.9)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">
                    <Icon className="size-[18px]" strokeWidth={2} />
                    {!loading && count > 0 ? (
                      <span
                        className={cn(
                          "absolute -left-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black tabular-nums",
                          active ? "bg-white text-[#b9531f]" : "bg-[#f1e6d6] text-[#8a6a48]",
                        )}
                      >
                        {toPersianDigits(count > 99 ? "99+" : count)}
                      </span>
                    ) : null}
                  </span>
                  <span className="relative max-w-full truncate px-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 rounded-[24px] bg-white/70" />
              <Skeleton className="h-36 rounded-[24px] bg-white/70" />
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
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center rounded-[26px] border-2 border-dashed border-[#ecd9bd] bg-white/60 px-6 py-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-[20px] bg-[#fdebd3] text-[#b9531f]">
                      <activeTab.icon className="size-7" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-3 text-[15px] font-black text-[#3b2410]">{activeTab.emptyTitle}</h2>
                    <p className="mt-1 max-w-72 text-[12px] leading-6 text-[#8a6a48]">{activeTab.emptyDescription}</p>
                    {tab === "pending_provider" ? (
                      <Link
                        href="/users/search"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-[#b9531f] px-5 py-2.5 text-[13px] font-black text-white"
                      >
                        <Search className="size-4" />
                        جستجوی خدمات
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visible.map((request) => (
                      <li key={request.requestId}>
                        <ConsumerRequestCard
                          request={request}
                          footer={
                            tab === "pending_provider" ? (
                              <div className="grid grid-cols-[1fr_auto] gap-2">
                                <Link
                                  href={
                                    request.searchId
                                      ? `/users/search/results?searchId=${request.searchId}&requestId=${request.requestId}`
                                      : "/users/search"
                                  }
                                  className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-[#fff1df] text-[12.5px] font-black text-[#a0561a] ring-1 ring-[#f3d3a8]"
                                >
                                  <UserPlus className="size-4" />
                                  ارسال به خدمات‌دهندگان بیشتر
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelTarget(request);
                                    setSheetKey((key) => key + 1);
                                  }}
                                  className="h-10 rounded-2xl px-4 text-[12.5px] font-bold text-[#b23a1f] ring-1 ring-[#f3c4b8] hover:bg-[#fde2dc]/50"
                                >
                                  لغو
                                </button>
                              </div>
                            ) : undefined
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && tab === "pending_provider" && visible.length > 0 ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#a08463]">
              <Send className="size-3.5" />
              اولین خدمات‌دهنده‌ای که بپذیرد، کار را انجام می‌دهد.
            </p>
          ) : null}
        </div>

        <CancelRequestSheet
          open={cancelTarget !== null}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          serviceName={cancelTarget?.serviceName ?? ""}
          reasonRequired={cancelTarget?.status === "in_progress"}
          formKey={sheetKey}
          onConfirm={handleCancel}
        />
      </PageContainer>
    </MotionConfig>
  );
}

export default function ConsumerRequestsPage() {
  return (
    <Suspense>
      <ConsumerRequestsContent />
    </Suspense>
  );
}
