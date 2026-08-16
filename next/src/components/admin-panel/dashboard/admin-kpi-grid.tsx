"use client";

import {
  BadgeCheck,
  BellRing,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Users,
  UserCheck,
} from "lucide-react";

import { AdminKpiCard } from "@/components/admin-panel/dashboard/admin-kpi-card";
import {
  formatCompactToman,
  type AdminDashboardKpis,
} from "@/lib/api/admin-dashboard";
import { toPersianDigits } from "@/lib/utils/format";

interface AdminKpiGridProps {
  data: AdminDashboardKpis;
}

export function AdminKpiGrid({ data }: AdminKpiGridProps) {
  const openRequests =
    data.requestsByStatus.pending_provider + data.requestsByStatus.in_progress;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AdminKpiCard
        label="کل کاربران"
        value={toPersianDigits(data.totalUsers)}
        hint={`فعال در بازه: ${toPersianDigits(data.activeUsers)}`}
        icon={Users}
      />
      <AdminKpiCard
        label="خدمات‌دهندگان"
        value={toPersianDigits(data.totalProviders)}
        hint={`تأییدشده ${toPersianDigits(data.approvedProviders)} · در دسترس ${toPersianDigits(data.availableProviders)}`}
        icon={BadgeCheck}
        tone="success"
      />
      <AdminKpiCard
        label="درخواست‌های باز"
        value={toPersianDigits(openRequests)}
        hint={`اتمام‌یافته در بازه: ${toPersianDigits(data.requestsByStatus.completed)}`}
        icon={ClipboardList}
      />
      <AdminKpiCard
        label="درآمد اشتراک (پرداخت‌شده)"
        value={`${formatCompactToman(data.subscriptionRevenuePaidToman)} تومان`}
        hint="جمع مبلغ پرداخت‌های موفق در بازه"
        icon={CircleDollarSign}
        tone="success"
      />
      <AdminKpiCard
        label="کاربران فعال بازه"
        value={toPersianDigits(data.activeUsers)}
        hint="بر اساس آخرین ورود در بازه انتخابی"
        icon={UserCheck}
      />
      <AdminKpiCard
        label="پرداخت ناموفق"
        value={toPersianDigits(data.paymentFailuresCount)}
        hint="نیاز به پیگیری مالی"
        icon={CreditCard}
        tone={data.paymentFailuresCount > 0 ? "danger" : "default"}
      />
      <AdminKpiCard
        label="خطای ارسال اعلان"
        value={toPersianDigits(data.notificationDeliveryFailuresCount)}
        hint="deliveryهای ناموفق در بازه"
        icon={BellRing}
        tone={
          data.notificationDeliveryFailuresCount > 0 ? "warning" : "default"
        }
      />
      <AdminKpiCard
        label="Provider در دسترس"
        value={toPersianDigits(data.availableProviders)}
        hint={`از ${toPersianDigits(data.approvedProviders)} تأییدشده`}
        icon={BadgeCheck}
      />
    </div>
  );
}
