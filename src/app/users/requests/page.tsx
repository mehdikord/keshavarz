"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cancelConsumerRequest,
  fetchConsumerRequests,
  type AppConsumerRequestSummary,
  type AppRequestStatus,
} from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import type { RequestStatus } from "@/types";

type ConsumerRequestTab = AppRequestStatus;

const TAB_CONFIG: {
  value: ConsumerRequestTab;
  label: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    value: "pending_provider",
    label: "در انتظار",
    icon: Clock3,
    emptyTitle: "درخواست در انتظاری ندارید",
    emptyDescription: "پس از جستجو، درخواست‌های ارسالی اینجا نمایش داده می‌شوند",
  },
  {
    value: "in_progress",
    label: "در حال انجام",
    icon: Wrench,
    emptyTitle: "کار فعالی ندارید",
    emptyDescription: "درخواست‌های تأییدشده اینجا قرار می‌گیرند",
  },
  {
    value: "completed",
    label: "پایان یافته",
    icon: BadgeCheck,
    emptyTitle: "خدمت تمام‌شده‌ای نیست",
    emptyDescription: "تاریخچه خدمات دریافت‌شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
    icon: XCircle,
    emptyTitle: "درخواست لغوشده‌ای نیست",
    emptyDescription: "درخواست‌های لغوشده اینجا نمایش داده می‌شوند",
  },
];

function formatCreatedDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function RequestSummaryCard({
  request,
  showPendingActions,
  onCancel,
}: {
  request: AppConsumerRequestSummary;
  showPendingActions?: boolean;
  onCancel?: () => void;
}) {
  const status = request.status as RequestStatus;
  const isPending = status === "pending_provider";

  return (
    <Link
      href={`/users/requests/${request.requestId}`}
      className="group block cursor-pointer"
      onClick={(e) => {
        if (showPendingActions) {
          // Prevent navigation when clicking action buttons
          const target = e.target as HTMLElement;
          if (target.closest('button')) {
            e.preventDefault();
          }
        }
      }}
    >
      <Card
        className={cn(
          "card-elevated overflow-hidden border-border/70 transition-all duration-200",
          "hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(45,106,79,0.1)]",
          isPending && "border-l-4 border-l-primary"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground truncate">
                  {request.serviceName}
                </p>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {request.landTitle}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-accent" />
              <span>{formatCreatedDate(request.createdAt)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-accent" />
              <span className="truncate max-w-[150px]">{request.landTitle}</span>
            </span>
          </div>

          {request.status === "in_progress" && request.assignedProviderName ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {request.assignedProviderName}
              </span>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <PriceDisplay
              amount={
                request.agreedPriceToman && request.agreedPriceToman > 0
                  ? request.agreedPriceToman
                  : 0
              }
              size="sm"
            />
            {!request.agreedPriceToman || request.agreedPriceToman <= 0 ? (
              <span className="text-xs text-muted-foreground">قیمت پس از قبول</span>
            ) : null}
          </div>

          {showPendingActions ? (
            <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-destructive/30 text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel?.();
                }}
              >
                لغو درخواست
              </Button>
              <Button
                asChild
                variant="secondary"
                className="h-10 rounded-xl"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {request.searchId ? (
                  <Link
                    href={`/users/search/results?searchId=${request.searchId}&requestId=${request.requestId}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ارسال به بیشتر
                  </Link>
                ) : (
                  <Link
                    href="/users/search"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ارسال به بیشتر
                  </Link>
                )}
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-center text-xs text-muted-foreground/70">
              کلیک کنید تا جزئیات را مشاهده کنید
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ConsumerRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] =
    useState<ConsumerRequestTab>("pending_provider");
  const [tabData, setTabData] = useState<
    Record<ConsumerRequestTab, AppConsumerRequestSummary[]>
  >({
    pending_provider: [],
    in_progress: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    void fetchConsumerRequests({
      status: activeTab,
      limit: 50,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setTabData((current) => ({
          ...current,
          [activeTab]: result.items,
        }));
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setTabData((current) => ({
          ...current,
          [activeTab]: [],
        }));
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری درخواست‌ها ناموفق بود",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user, activeTab, reloadKey]);

  if (!user) return null;

  const handleCancelPending = async (request: AppConsumerRequestSummary) => {
    try {
      await cancelConsumerRequest(request.requestId, {
        expectedVersion: request.version,
        reason: "لغو توسط خدمات‌گیرنده",
      });
      toast.info("درخواست لغو شد");
      setReloadKey((key) => key + 1);
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "لغو درخواست ناموفق بود",
      );
    }
  };

  const handleTabChange = (value: string) => {
    setLoading(true);
    setActiveTab(value as ConsumerRequestTab);
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="درخواست‌ها"
        description="پیگیری وضعیت درخواست‌های شما"
      />

      <MotionConfig reducedMotion="user">
        <Tabs
          dir="rtl"
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList
            dir="rtl"
            variant="line"
            className="relative grid w-full grid-cols-4 gap-1 rounded-2xl border border-primary/10 bg-surface/95 p-1.5 shadow-[0_6px_20px_rgba(45,106,79,0.08)] group-data-[orientation=horizontal]/tabs:h-auto"
          >
            {TAB_CONFIG.map((tab) => {
              const isActive = tab.value === activeTab;
              const count =
                loading && isActive
                  ? "…"
                  : (tabData[tab.value]?.length ?? 0).toLocaleString("fa-IR");

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative flex h-16 min-h-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold whitespace-nowrap text-muted-foreground transition-colors duration-200 hover:text-foreground data-[state=active]:text-white group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-0"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="consumer-requests-active-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-l from-primary to-success shadow-[0_4px_12px_rgba(45,106,79,0.28)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}

                  <span className="relative z-10 flex h-5 items-center">
                    <tab.icon
                      className="size-5"
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "absolute -left-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold tabular-nums shadow-sm",
                        isActive
                          ? "bg-white text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  <span className="relative z-10 max-w-full truncate leading-none">
                    {tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TAB_CONFIG.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3">
              {loading && tab.value === activeTab ? (
                <LoadingSpinner className="py-12" />
              ) : tabData[tab.value].length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title={tab.emptyTitle}
                  description={tab.emptyDescription}
                />
              ) : (
                tabData[tab.value].map((request) => (
                  <RequestSummaryCard
                    key={request.requestId}
                    request={request}
                    showPendingActions={tab.value === "pending_provider"}
                    onCancel={() => void handleCancelPending(request)}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </MotionConfig>
    </PageContainer>
  );
}
