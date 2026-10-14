"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Banknote,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
} from "@/components/admin-panel";
import { AdminDashboardToolbar } from "@/components/admin-panel/dashboard/admin-dashboard-toolbar";
import { AdminKpiCard } from "@/components/admin-panel/dashboard/admin-kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  dashboardRangeFromPreset,
  detectDashboardPreset,
  type DashboardRangePreset,
} from "@/lib/api/admin-dashboard";
import {
  fetchAdminReportsOverview,
  formatReportRate,
  type AdminReportsOverview,
} from "@/lib/api/admin-reports";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

const AdminReportsFunnelChart = dynamic(
  () =>
    import("@/components/admin-panel/reports/admin-reports-funnel-chart").then(
      (module) => module.AdminReportsFunnelChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[22rem] w-full rounded-xl" />,
  },
);

export function AdminReportsOverviewPage() {
  const { can } = useAdminPermissions();
  const canView = can("reports.view");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialRange = useMemo(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (fromParam && toParam) {
      return {
        from: fromParam,
        to: toParam,
        preset: detectDashboardPreset(fromParam, toParam),
      };
    }
    const range = dashboardRangeFromPreset("30d");
    return { ...range, preset: "30d" as const };
  }, [searchParams]);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [preset, setPreset] = useState<DashboardRangePreset | "custom">(
    initialRange.preset,
  );
  const [data, setData] = useState<AdminReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const syncUrl = useCallback(
    (nextFrom: string, nextTo: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", nextFrom);
      params.set("to", nextTo);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const onPresetChange = useCallback(
    (nextPreset: DashboardRangePreset) => {
      const range = dashboardRangeFromPreset(nextPreset);
      setLoading(true);
      setError(null);
      setPreset(nextPreset);
      setFrom(range.from);
      setTo(range.to);
      syncUrl(range.from, range.to);
    },
    [syncUrl],
  );

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();

    void fetchAdminReportsOverview({
      from,
      signal: controller.signal,
      to,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const message = isApiClientError(cause)
          ? cause.message
          : "بارگذاری گزارش کلی ناموفق بود.";
        setError(message);
        setData(null);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, from, to, reloadKey]);

  if (!canView) {
    return <AdminForbidden />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="گزارش کلی"
        description="شاخص‌های عملیاتی و قیف درخواست‌ها از API — بدون محاسبه مالی سمت کلاینت."
      />

      <AdminDashboardToolbar
        from={from}
        loading={loading}
        onPresetChange={onPresetChange}
        onRefresh={() => {
          setLoading(true);
          setReloadKey((value) => value + 1);
        }}
        preset={preset}
        timezone={data?.timezone ?? "Asia/Tehran"}
        to={to}
      />

      {error ? (
        <AdminSectionCard>
          <p className="text-sm text-destructive">{error}</p>
        </AdminSectionCard>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AdminKpiCard
              icon={Banknote}
              label="GMV"
              value={formatPrice(data.gmvToman)}
              hint="تومان"
            />
            <AdminKpiCard
              icon={Wallet}
              label="درآمد اشتراک"
              value={formatPrice(data.subscriptionRevenuePaidToman)}
              hint="پرداخت‌شده"
              tone="success"
            />
            <AdminKpiCard
              icon={RefreshCw}
              label="بازپرداخت موفق"
              value={formatPrice(data.refundsSucceededToman)}
              tone="warning"
            />
            <AdminKpiCard
              icon={Users}
              label="کاربران فعال"
              value={toPersianDigits(data.activeUsers)}
              hint={`ارائه‌دهنده فعال: ${toPersianDigits(data.activeProviders)}`}
            />
            <AdminKpiCard
              icon={AlertTriangle}
              label="نرخ شکست پرداخت"
              value={formatReportRate(data.paymentFailureRate)}
              tone="danger"
            />
            <AdminKpiCard
              icon={Activity}
              label="نرخ شکست اعلان"
              value={formatReportRate(data.notificationDeliveryFailureRate)}
            />
          </div>

          <AdminReportsFunnelChart funnel={data.funnel} />
        </>
      ) : null}
    </div>
  );
}
