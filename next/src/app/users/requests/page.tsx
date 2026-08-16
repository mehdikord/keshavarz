"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ClipboardList, MapPin } from "lucide-react";

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
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";
import type { RequestStatus } from "@/types";

type ConsumerRequestTab = AppRequestStatus;

const TAB_CONFIG: {
  value: ConsumerRequestTab;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    value: "pending_provider",
    label: "در انتظار",
    emptyTitle: "درخواست در انتظاری ندارید",
    emptyDescription: "پس از جستجو، درخواست‌های ارسالی اینجا نمایش داده می‌شوند",
  },
  {
    value: "in_progress",
    label: "در حال انجام",
    emptyTitle: "کار فعالی ندارید",
    emptyDescription: "درخواست‌های تأییدشده اینجا قرار می‌گیرند",
  },
  {
    value: "completed",
    label: "پایان یافته",
    emptyTitle: "خدمت تمام‌شده‌ای نیست",
    emptyDescription: "تاریخچه خدمات دریافت‌شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
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

  return (
    <Card className="card-elevated overflow-hidden border-border/70">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{request.serviceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.landTitle}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-accent" />
            <span>{formatCreatedDate(request.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-accent" />
            <span>{request.landTitle}</span>
          </div>
        </div>

        {request.status === "in_progress" && request.assignedProviderName ? (
          <p className="text-sm text-muted-foreground">
            خدمات‌دهنده:{" "}
            <span className="font-medium text-foreground">
              {request.assignedProviderName}
            </span>
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-destructive/30 text-destructive"
              onClick={onCancel}
            >
              لغو درخواست
            </Button>
            <Button asChild variant="secondary" className="h-10 rounded-xl">
              <Link href="/users/search">ارسال به بیشتر</Link>
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="h-10 w-full rounded-xl">
            <Link href={`/users/requests/${request.requestId}`}>
              مشاهده جزئیات
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
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

      <Tabs
        dir="rtl"
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-3"
      >
        <TabsList
          dir="rtl"
          className="grid h-11 w-full grid-cols-4 rounded-xl border border-primary/10 bg-surface p-1 shadow-[0_5px_18px_rgba(45,106,79,0.07)]"
        >
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="group h-9 min-w-0 gap-1 rounded-lg px-1 text-[12px] font-semibold text-muted-foreground transition-all duration-200 data-[state=active]:bg-gradient-to-l data-[state=active]:from-primary data-[state=active]:to-success data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_12px_rgba(45,106,79,0.2)]"
            >
              <span className="truncate">{tab.label}</span>
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground transition-colors group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                {tab.value === activeTab && !loading
                  ? tabData[tab.value].length.toLocaleString("fa-IR")
                  : tab.value === activeTab
                    ? "…"
                    : "۰"}
              </span>
            </TabsTrigger>
          ))}
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
    </PageContainer>
  );
}
