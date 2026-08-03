"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProviderRequestCard } from "@/components/providers-panel/provider-request-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import {
  countNewProviderRequests,
  getProviderRequestsForTab,
  type ProviderRequestTab,
} from "@/lib/utils/provider-requests";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import { useProviderStore } from "@/stores/provider-store";
import { useRequestStore } from "@/stores/request-store";

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

export default function ProviderRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const requests = useRequestStore((state) => state.requests);
  const requestProviders = useRequestStore((state) => state.requestProviders);
  const acceptRequest = useRequestStore((state) => state.acceptRequest);
  const rejectRequest = useRequestStore((state) => state.rejectRequest);
  const offeredServices = useProviderStore((state) => state.offeredServices);
  const [activeTab, setActiveTab] = useState<ProviderRequestTab>("new");

  const providerId = user?.id ?? "";
  const newCount = providerId
    ? countNewProviderRequests(providerId, requests, requestProviders)
    : 0;

  const tabData = useMemo(() => {
    if (!providerId) {
      return TAB_CONFIG.reduce(
        (acc, tab) => {
          acc[tab.value] = [];
          return acc;
        },
        {} as Record<ProviderRequestTab, ReturnType<typeof getProviderRequestsForTab>>,
      );
    }

    return TAB_CONFIG.reduce(
      (acc, tab) => {
        acc[tab.value] = getProviderRequestsForTab(
          providerId,
          tab.value,
          requests,
          requestProviders,
        );
        return acc;
      },
      {} as Record<ProviderRequestTab, ReturnType<typeof getProviderRequestsForTab>>,
    );
  }, [providerId, requests, requestProviders]);

  if (!user) return null;

  const handleAccept = (requestId: string, serviceId: string) => {
    const price =
      offeredServices.find((service) => service.serviceId === serviceId)
        ?.price ?? 0;

    if (!price) {
      toast.error("قیمت این خدمت در پروفایل شما ثبت نشده");
      return;
    }

    const error = acceptRequest(requestId, providerId, price);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("درخواست پذیرفته شد");
    setActiveTab("in_progress");
  };

  const handleReject = (requestId: string) => {
    const error = rejectRequest(requestId, providerId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.info("درخواست رد شد");
  };

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
              tabData[tab.value].map(({ request }) => (
                <ProviderRequestCard
                  key={request.id}
                  request={request}
                  showQuickActions={tab.value === "new"}
                  onAccept={() => handleAccept(request.id, request.serviceId)}
                  onReject={() => handleReject(request.id)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
