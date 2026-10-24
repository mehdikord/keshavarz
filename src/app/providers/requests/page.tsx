"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Archive,
  BadgeCheck,
  Inbox,
  RotateCw,
  Tractor,
  Wallet,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import {
  RequestActionSheet,
  type RequestAction,
} from "@/components/providers-panel/requests/request-action-sheet";
import { RequestCard } from "@/components/providers-panel/requests/request-card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/api/envelope";
import {
  acceptProviderRequest,
  fetchProviderRequests,
  rejectProviderRequest,
  type AppProviderRequestSummary,
} from "@/lib/api/app-requests";
import {
  classifyProviderRequest,
  parseProviderRequestTab,
  type ProviderRequestTab,
} from "@/lib/requests/provider-tabs";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface TabConfig {
  key: ProviderRequestTab;
  label: string;
  icon: typeof Inbox;
  emptyTitle: string;
  emptyDescription: string;
}

const TABS: [TabConfig, TabConfig, TabConfig, TabConfig] = [
  {
    key: "new",
    label: "جدید",
    icon: Inbox,
    emptyTitle: "درخواست تازه‌ای ندارید",
    emptyDescription: "درخواست کشاورزان نزدیک شما به‌محض ثبت، همین‌جا نمایش داده می‌شود.",
  },
  {
    key: "active",
    label: "در حال انجام",
    icon: Tractor,
    emptyTitle: "کار فعالی ندارید",
    emptyDescription: "درخواست‌هایی که قبول کنید اینجا قرار می‌گیرند.",
  },
  {
    key: "done",
    label: "انجام‌شده",
    icon: BadgeCheck,
    emptyTitle: "هنوز کاری تکمیل نشده",
    emptyDescription: "کارهایی که کشاورز تکمیل‌شده اعلام کند اینجا می‌آیند.",
  },
  {
    key: "archive",
    label: "بایگانی",
    icon: Archive,
    emptyTitle: "بایگانی خالی است",
    emptyDescription: "درخواست‌های ردشده، لغوشده یا سپرده‌شده به دیگران اینجا هستند.",
  },
];

interface ActionState {
  action: Exclude<RequestAction, "cancel">;
  request: AppProviderRequestSummary;
}

function ProviderRequestsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseProviderRequestTab(searchParams.get("tab"));

  const [requests, setRequests] = useState<AppProviderRequestSummary[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);

  const loadRequests = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchProviderRequests({ signal, limit: 50 });
    return result.items;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    loadRequests(controller.signal)
      .then((items) => {
        if (cancelled) return;
        setRequests(items);
        setLoadState("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setLoadState("error");
        toast.error(
          isApiClientError(cause) ? cause.message : "بارگذاری درخواست‌ها ناموفق بود.",
        );
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadRequests]);

  const grouped = useMemo(() => {
    const groups: Record<ProviderRequestTab, AppProviderRequestSummary[]> = {
      new: [],
      active: [],
      done: [],
      archive: [],
    };
    for (const item of requests) {
      groups[classifyProviderRequest(item).tab].push(item);
    }
    for (const list of Object.values(groups)) {
      list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }
    return groups;
  }, [requests]);

  const doneRevenue = grouped.done.reduce((sum, item) => sum + item.priceToman, 0);

  const selectTab = (next: ProviderRequestTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "new") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      setRequests(await loadRequests());
      setLoadState("ready");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "به‌روزرسانی درخواست‌ها ناموفق بود.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const openAction = (action: ActionState["action"], request: AppProviderRequestSummary) => {
    setActionState({ action, request });
    setSheetKey((key) => key + 1);
    setSheetOpen(true);
  };

  const handleConfirm = async (reason?: string) => {
    if (!actionState) return false;
    const { action, request } = actionState;

    try {
      if (action === "accept") {
        await acceptProviderRequest(request.requestId, { expectedVersion: request.version });
        toast.success("درخواست پذیرفته شد", "برای هماهنگی با کشاورز تماس بگیرید");
      } else {
        await rejectProviderRequest(request.requestId, {
          expectedVersion: request.version,
          reason,
        });
        toast.info("درخواست رد شد");
      }
      setSheetOpen(false);
      setRequests(await loadRequests());
      if (action === "accept") selectTab("active");
      return true;
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : action === "accept"
            ? "پذیرش درخواست ناموفق بود."
            : "رد درخواست ناموفق بود.",
      );
      // Another provider may have taken it; show the current state.
      void loadRequests().then(setRequests).catch(() => undefined);
      return false;
    }
  };

  const loading = loadState === "loading";
  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
  const visible = grouped[tab];

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero
          title="درخواست‌ها"
          subtitle="درخواست کشاورزان را بررسی کنید، بپذیرید و کارها را پیگیری کنید."
          actions={
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing || loading}
              aria-label="به‌روزرسانی"
              className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-60"
            >
              <RotateCw className={cn("size-5", refreshing && "animate-spin")} strokeWidth={1.9} />
            </button>
          }
          stats={[
            {
              icon: Inbox,
              label: "منتظر پاسخ",
              value: loading ? "…" : toPersianDigits(grouped.new.length),
              warn: !loading && grouped.new.length > 0,
            },
            {
              icon: Wrench,
              label: "کار فعال",
              value: loading ? "…" : toPersianDigits(grouped.active.length),
            },
            {
              icon: Wallet,
              label: "درآمد انجام‌شده",
              value: loading ? "…" : new Intl.NumberFormat("fa-IR", { notation: "compact" }).format(doneRevenue),
            },
          ]}
        />

        <div className="sticky top-0 z-20 -mt-5 px-4 pb-3 pt-2">
          <div
            role="tablist"
            aria-label="وضعیت درخواست‌ها"
            className="grid grid-cols-4 gap-1 rounded-[20px] bg-surface/90 p-1.5 shadow-[0_12px_30px_-16px_rgba(45,106,79,0.45)] ring-1 ring-border/60 backdrop-blur-xl"
          >
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = item.key === tab;
              const count = grouped[item.key].length;
              const urgent = item.key === "new" && count > 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(item.key)}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] font-bold transition-colors",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="requests-tab-pill"
                      className="absolute inset-0 rounded-[14px] bg-primary shadow-[0_8px_18px_-10px_rgba(45,106,79,0.9)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">
                    <Icon className="size-[18px]" strokeWidth={2} />
                    {!loading && count > 0 ? (
                      <span
                        className={cn(
                          "absolute -left-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black tabular-nums",
                          active
                            ? "bg-white text-primary"
                            : urgent
                              ? "bg-[#e8892c] text-white"
                              : "bg-muted text-muted-foreground",
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

        <div className="px-4 pt-2">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 rounded-[24px]" />
              <Skeleton className="h-40 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
            </div>
          ) : loadState === "error" ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-10 text-center ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">بارگذاری درخواست‌ها ناموفق بود.</p>
              <button
                type="button"
                onClick={() => void refresh()}
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
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center rounded-[26px] border-2 border-dashed border-border bg-surface/60 px-6 py-10 text-center">
                    <span className="flex size-14 items-center justify-center rounded-[20px] bg-muted text-muted-foreground">
                      <activeTab.icon className="size-7" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-3 text-[15px] font-black text-foreground">{activeTab.emptyTitle}</h2>
                    <p className="mt-1 max-w-72 text-[12px] leading-6 text-muted-foreground">
                      {activeTab.emptyDescription}
                    </p>
                    {tab === "new" ? (
                      <Link
                        href="/providers/services"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-[12px] font-bold text-primary"
                      >
                        <Wrench className="size-3.5" />
                        تکمیل خدمات و محدوده کاری
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {visible.map((request) => (
                        <motion.li
                          key={request.requestId}
                          layout
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RequestCard
                            request={request}
                            state={classifyProviderRequest(request)}
                            busy={sheetOpen && actionState?.request.requestId === request.requestId}
                            onAccept={() => openAction("accept", request)}
                            onReject={() => openAction("reject", request)}
                          />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <RequestActionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          action={actionState?.action ?? "accept"}
          target={actionState?.request ?? null}
          formKey={sheetKey}
          onConfirm={handleConfirm}
        />
      </PageContainer>
    </MotionConfig>
  );
}

export default function ProviderRequestsPage() {
  return (
    <Suspense>
      <ProviderRequestsContent />
    </Suspense>
  );
}
