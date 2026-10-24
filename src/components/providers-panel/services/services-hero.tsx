"use client";

import { MapPinned, Radar, Wrench } from "lucide-react";

import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import { toPersianDigits } from "@/lib/utils/format";

interface ServicesHeroProps {
  loading: boolean;
  activeServices: number;
  workRadiusKm: number;
  workAreaConfigured: boolean;
}

export function ServicesHero({
  loading,
  activeServices,
  workRadiusKm,
  workAreaConfigured,
}: ServicesHeroProps) {
  return (
    <ProviderPageHero
      title="ارائه خدمات"
      subtitle="خدمات و قیمت‌ها، محدوده کاری و نمونه‌کارهای خود را مدیریت کنید."
      stats={[
        {
          icon: Wrench,
          label: "خدمت فعال",
          value: loading ? "…" : toPersianDigits(activeServices),
        },
        {
          icon: Radar,
          label: "شعاع پوشش",
          value: loading ? "…" : `${toPersianDigits(workRadiusKm)} کیلومتر`,
        },
        {
          icon: MapPinned,
          label: "محدوده کاری",
          value: loading ? "…" : workAreaConfigured ? "ثبت شده" : "ثبت نشده",
          warn: !loading && !workAreaConfigured,
        },
      ]}
    />
  );
}
