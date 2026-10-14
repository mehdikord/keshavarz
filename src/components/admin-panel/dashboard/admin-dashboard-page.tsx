"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AdminForbidden } from "@/components/admin-panel/auth/admin-forbidden";
import { AdminPageHeader } from "@/components/admin-panel/shell/admin-page-header";
import { AdminDashboardToolbar } from "@/components/admin-panel/dashboard/admin-dashboard-toolbar";
import { AdminKpiGrid } from "@/components/admin-panel/dashboard/admin-kpi-grid";
import { AdminOpsStrip } from "@/components/admin-panel/dashboard/admin-ops-strip";
import { AdminQuickLinks } from "@/components/admin-panel/dashboard/admin-quick-links";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";
import {
  dashboardRangeFromPreset,
  detectDashboardPreset,
  fetchAdminDashboard,
  fetchAdminHealth,
  fetchAdminMetrics,
  type AdminDashboardKpis,
  type AdminHealth,
  type AdminMetrics,
  type DashboardRangePreset,
} from "@/lib/api/admin-dashboard";
import { isApiClientError } from "@/lib/api/envelope";

const AdminRequestStatusChart = dynamic(
  () =>
    import("@/components/admin-panel/dashboard/admin-request-status-chart").then(
      (module) => module.AdminRequestStatusChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[22rem] w-full rounded-xl" />,
  },
);

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Skeleton className="h-[22rem] rounded-xl" />
        <Skeleton className="h-[22rem] rounded-xl" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}

export function AdminDashboardPage() {
  const { can } = useAdminPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canViewDashboard = can("dashboard.view");

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
  const [data, setData] = useState<AdminDashboardKpis | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
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
    if (!canViewDashboard) return;

    const controller = new AbortController();

    void Promise.all([
      fetchAdminDashboard({ from, to, signal: controller.signal }),
      fetchAdminMetrics(controller.signal).catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setMetricsError(
            isApiClientError(cause)
              ? cause.message
              : "بارگذاری متریک ناموفق بود.",
          );
        }
        return null;
      }),
      fetchAdminHealth(controller.signal).catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setHealthError(
            isApiClientError(cause)
              ? cause.message
              : "بررسی سلامت نشست ناموفق بود.",
          );
        }
        return null;
      }),
    ])
      .then(([dashboard, nextMetrics, nextHealth]) => {
        if (controller.signal.aborted) return;
        setData(dashboard);
        setMetrics(nextMetrics);
        setHealth(nextHealth);
        if (nextMetrics) setMetricsError(null);
        if (nextHealth) setHealthError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری داشبورد ناموفق بود.",
        );
        if (isApiClientError(cause) && cause.status === 403) {
          toast.error("مجوز مشاهده داشبورد را ندارید.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [canViewDashboard, from, reloadKey, to]);

  if (!canViewDashboard) {
    return <AdminForbidden />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="داشبورد عملیات"
        description="نمای زنده KPIها، صف‌های عملیاتی و سلامت نشست مدیریت."
      />

      <AdminDashboardToolbar
        preset={preset}
        from={data?.from ?? from}
        to={data?.to ?? to}
        timezone={data?.timezone ?? "Asia/Tehran"}
        loading={loading}
        onPresetChange={onPresetChange}
        onRefresh={() => {
          setLoading(true);
          setError(null);
          setReloadKey((value) => value + 1);
        }}
      />

      {loading && !data ? <DashboardSkeleton /> : null}

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <AdminKpiGrid data={data} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
            <AdminRequestStatusChart data={data} />
            <AdminQuickLinks data={data} />
          </div>
          <AdminOpsStrip
            health={health}
            metrics={metrics}
            healthError={healthError}
            metricsError={metricsError}
          />
        </>
      ) : null}
    </div>
  );
}
