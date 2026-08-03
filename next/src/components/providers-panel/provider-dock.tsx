"use client";

import {
  BarChart3,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Wrench,
} from "lucide-react";

import { DockNav } from "@/components/layout/dock-nav";
import { countNewProviderRequests } from "@/lib/utils/provider-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useRequestStore } from "@/stores/request-store";

export function ProviderDock() {
  const userId = useAuthStore((state) => state.user?.id);
  const requests = useRequestStore((state) => state.requests);
  const requestProviders = useRequestStore((state) => state.requestProviders);

  const newCount = userId
    ? countNewProviderRequests(userId, requests, requestProviders)
    : 0;

  return (
    <DockNav
      items={[
        {
          label: "ارائه خدمات",
          href: "/providers/services",
          icon: Wrench,
        },
        {
          label: "درخواست‌ها",
          href: "/providers/requests",
          icon: Inbox,
          badge: newCount,
        },
        {
          label: "داشبورد",
          href: "/providers/home",
          icon: LayoutDashboard,
          featured: true,
        },
        {
          label: "گزارشات",
          href: "/providers/reports",
          icon: BarChart3,
        },
        {
          label: "اشتراک‌ها",
          href: "/providers/subscription",
          icon: CreditCard,
        },
      ]}
    />
  );
}
