"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  Inbox,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PriceDisplay } from "@/components/shared/price-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiClientError } from "@/lib/api/envelope";
import {
  acceptProviderRequest,
  fetchProviderRequests,
  rejectProviderRequest,
  type AppProviderRequestSummary,
} from "@/lib/api/app-requests";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import type { ProviderRequestTab } from "@/lib/requests/provider-tabs";
import { useAuthStore } from "@/stores/auth-store";
import type { RequestStatus } from "@/types";

const TAB_CONFIG: {
  value: ProviderRequestTab;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    value: "new",
    label: "جدید",
    emptyTitle: "درخواست جدیدی ندارید",
    emptyDescription: "درخواست‌های جدید اینجا نمایش داده می‌شوند",
  },
  {
    value: "in_progress",
    label: "در حال انجام",
    emptyTitle: "کار فعالی ندارید",
    emptyDescription: "درخواست‌های پذیرفته‌شده اینجا قرار می‌گیرند",
  },
  {
    value: "completed",
    label: "پایان‌یافته",
    emptyTitle: "کار تمام‌شده‌ای نیست",
    emptyDescription: "تاریخچه کارهای انجام‌شده",
  },
  {
    value: "cancelled",
    label: "لغوشده",
    emptyTitle: "درخواست لغوشده‌ای نیست",
    emptyDescription: "درخواست‌های لغوشده اینجا نمایش داده می‌شوند",
  },
];

function filterRequestsForTab(
  tab: ProviderRequestTab,
  items: AppProviderRequestSummary[],
): AppProviderRequestSummary[] {
  switch (tab) {
    case "new":
      return items.filter(
        (item) =>
          item.linkStatus === "sent" && item.status === "pending_provider",
      );
    case "in_progress":
      return items.filter(
        (item) =>
          item.linkStatus === "accepted" && item.status === "in_progress",
      );
    case "completed":
      return items.filter((item) => item.status === "completed");
    case "cancelled":
      return items.filter((item) => item.status === "cancelled");
    default:
      return [];
  }
}

function formatScheduledDates(dates: string[]): string {
  if (dates.length === 0) return "تاریخ نامشخص";

  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
  });

  return dates.map((date) => formatter.format(new Date(date))).join(" · ");
}

function ProviderRequestSummaryCard({
  request,
  showQuickActions = false,
  onAccept,
  onReject,
  busy = false,
}: {
  request: AppProviderRequestSummary;
  showQuickActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
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
          <StatusBadge status={request.status as RequestStatus} />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {request.landTitle}
              {request.distanceKm > 0
                ? ` · ${toPersianDigits(request.distanceKm.toFixed(1))} km`
                : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            <span>{formatScheduledDates([request.sentAt])}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <PriceDisplay
            amount={request.priceToman > 0 ? request.priceToman : 0}
            size="sm"
          />
          {request.priceToman <= 0 ? (
            <span className="text-xs text-muted-foreground">قیمت پس از قبول</span>
          ) : null}
        </div>

        {showQuickActions ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-10 rounded-xl"
              onClick={onAccept}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "قبول درخواست"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={onReject}
              disabled={busy}
            >
              رد درخواست
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="h-10 w-full rounded-xl">
            <Link href={`/providers/requests/${request.requestId}`}>
              مشاهده جزئیات
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<ProviderRequestTab>("new");
  const [requests, setRequests] = useState<AppProviderRequestSummary[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const reloadRequests = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchProviderRequests({ signal, limit: 50 });
    return result.items;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const items = await reloadRequests(controller.signal);
        if (cancelled) return;
        setRequests(items);
        setLoadState("ready");
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;
        setLoadState("error");
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری درخواست‌ها ناموفق بود.",
        );
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadRequests]);

  const tabData = useMemo(() => {
    return TAB_CONFIG.reduce(
      (acc, tab) => {
        acc[tab.value] = filterRequestsForTab(tab.value, requests);
        return acc;
      },
      {} as Record<ProviderRequestTab, AppProviderRequestSummary[]>,
    );
  }, [requests]);

  const newCount = tabData.new.length;

  if (!user) return null;

  const handleAccept = async (request: AppProviderRequestSummary) => {
    setBusyRequestId(request.requestId);
    try {
      await acceptProviderRequest(request.requestId, {
        expectedVersion: request.version,
      });
      const items = await reloadRequests();
      setRequests(items);
      toast.success("درخواست پذیرفته شد");
      setActiveTab("in_progress");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "پذیرش درخواست ناموفق بود.",
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleReject = async (request: AppProviderRequestSummary) => {
    setBusyRequestId(request.requestId);
    try {
      await rejectProviderRequest(request.requestId, {
        expectedVersion: request.version,
      });
      const items = await reloadRequests();
      setRequests(items);
      toast.info("درخواست رد شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "رد درخواست ناموفق بود.",
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  if (loadState === "loading") {
    return (
      <PageContainer withDock>
        <PageHeader
          title="درخواست‌ها"
          description="مدیریت درخواست‌های دریافتی"
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
          title="درخواست‌ها"
          description="مدیریت درخواست‌های دریافتی"
        />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            بارگذاری درخواست‌ها ناموفق بود.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="درخواست‌ها"
        description="مدیریت درخواست‌های دریافتی"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ProviderRequestTab)}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-muted/70 p-1">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-xl py-2.5 text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
            >
              {tab.label}
              {tab.value === "new" && newCount > 0 ? (
                <Badge className="mr-1 size-5 rounded-full bg-destructive p-0 text-[10px]">
                  {toPersianDigits(newCount)}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3">
            {tabData[tab.value].length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={tab.emptyTitle}
                description={tab.emptyDescription}
              />
            ) : (
              tabData[tab.value].map((request) => (
                <ProviderRequestSummaryCard
                  key={request.requestId}
                  request={request}
                  showQuickActions={tab.value === "new"}
                  busy={busyRequestId === request.requestId}
                  onAccept={() => void handleAccept(request)}
                  onReject={() => void handleReject(request)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
