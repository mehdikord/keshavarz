"use client";

import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  PieChart,
  Search,
} from "lucide-react";

import { DockNav } from "@/components/layout/dock-nav";

export function ConsumerDock() {
  return (
    <DockNav
      variant="consumer"
      homeHref="/users/home"
      items={[
        {
          label: "درخواست‌ها",
          href: "/users/requests",
          icon: ClipboardList,
        },
        {
          label: "جستجو",
          href: "/users/search",
          icon: Search,
        },
        {
          label: "داشبورد",
          href: "/users/home",
          icon: LayoutDashboard,
          featured: true,
        },
        {
          label: "زمین‌ها",
          href: "/users/lands",
          icon: MapPin,
        },
        {
          label: "گزارشات",
          href: "/users/reports",
          icon: PieChart,
        },
      ]}
    />
  );
}
