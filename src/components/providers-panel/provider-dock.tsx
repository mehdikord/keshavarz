"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Wrench,
} from "lucide-react";

import { DockNav } from "@/components/layout/dock-nav";
import { fetchAppProviderDashboard } from "@/lib/api/app-provider";

export function ProviderDock() {
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAppProviderDashboard(controller.signal)
      .then((dashboard) => {
        if (!controller.signal.aborted) {
          setNewCount(dashboard.counts.newRequests);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setNewCount(0);
      });
    return () => controller.abort();
  }, []);

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
