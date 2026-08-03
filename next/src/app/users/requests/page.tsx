"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { ConsumerRequestCard } from "@/components/consumer-panel/consumer-request-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import {
  getConsumerRequestsForTab,
  type ConsumerRequestTab,
} from "@/lib/utils/consumer-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useRequestStore } from "@/stores/request-store";

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
    label: "پایان‌یافته",
    emptyTitle: "خدمت تمام‌شده‌ای نیست",
    emptyDescription: "تاریخچه خدمات دریافت‌شده",
  },
  {
    value: "cancelled",
    label: "لغوشده",
    emptyTitle: "درخواست لغوشده‌ای نیست",
    emptyDescription: "درخواست‌های لغوشده اینجا نمایش داده می‌شوند",
  },
];

export default function ConsumerRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const requests = useRequestStore((state) => state.requests);
  const requestProviders = useRequestStore((state) => state.requestProviders);
  const cancelRequest = useRequestStore((state) => state.cancelRequest);
  const [activeTab, setActiveTab] =
    useState<ConsumerRequestTab>("pending_provider");

  const userLands = useMemo(
    () => (user ? lands.filter((land) => land.userId === user.id) : []),
    [lands, user],
  );

  const tabData = useMemo(() => {
    if (!user) {
      return TAB_CONFIG.reduce(
        (acc, tab) => {
          acc[tab.value] = [];
          return acc;
        },
        {} as Record<ConsumerRequestTab, ReturnType<typeof getConsumerRequestsForTab>>,
      );
    }

    return TAB_CONFIG.reduce(
      (acc, tab) => {
        acc[tab.value] = getConsumerRequestsForTab(
          user.id,
          tab.value,
          requests,
        );
        return acc;
      },
      {} as Record<ConsumerRequestTab, ReturnType<typeof getConsumerRequestsForTab>>,
    );
  }, [requests, user]);

  if (!user) return null;

  const handleCancelPending = (requestId: string) => {
    const error = cancelRequest(requestId, "consumer", "لغو توسط خدمات‌گیرنده");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.info("درخواست لغو شد");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="درخواست‌ها"
        description="پیگیری وضعیت درخواست‌های شما"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ConsumerRequestTab)}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-muted/70 p-1">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl py-2.5 text-xs data-[state=active]:bg-surface data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3">
            {tabData[tab.value].length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={tab.emptyTitle}
                description={tab.emptyDescription}
              />
            ) : (
              tabData[tab.value].map((request) => (
                <ConsumerRequestCard
                  key={request.id}
                  request={request}
                  lands={userLands}
                  requestProviders={requestProviders}
                  showPendingActions={tab.value === "pending_provider"}
                  onCancel={() => handleCancelPending(request.id)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
