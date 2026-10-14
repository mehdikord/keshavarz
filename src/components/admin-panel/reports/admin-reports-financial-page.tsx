"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Banknote, Receipt, Ticket, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  AdminDataTable,
  AdminForbidden,
  AdminPageHeader,
  AdminSectionCard,
  type AdminDataTableColumn,
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
  fetchAdminReportsFinancial,
  type AdminReportsFinancial,
} from "@/lib/api/admin-reports";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

const AdminMonthlyGmvChart = dynamic(
  () =>
    import("@/components/admin-panel/reports/admin-monthly-gmv-chart").then(
      (module) => module.AdminMonthlyGmvChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[22rem] w-full rounded-xl" />,
  },
);

type TopService = AdminReportsFinancial["topServices"][number];

export function AdminReportsFinancialPage() {
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
  const [data, setData] = useState<AdminReportsFinancial | null>(null);
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

    void fetchAdminReportsFinancial({
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
          : "بارگذاری گزارش مالی ناموفق بود.";
        setError(message);
        setData(null);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, from, to, reloadKey]);

  const columns: AdminDataTableColumn<TopService>[] = useMemo(
    () => [
      {
        id: "name",
        header: "خدمت",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.serviceId}
            </p>
          </div>
        ),
      },
      {
        id: "totalToman",
        header: "GMV",
        cell: (row) => formatPrice(row.totalToman),
      },
    ],
    [],
  );

  if (!canView) {
    return <AdminForbidden />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="گزارش مالی"
        description="GMV، تیکت میانگین و خلاصه پرداخت‌ها — فقط اعداد API."
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
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminKpiCard
              icon={Banknote}
              label="GMV"
              value={formatPrice(data.gmvToman)}
            />
            <AdminKpiCard
              icon={Ticket}
              label="میانگین تیکت"
              value={formatPrice(data.averageTicketToman)}
              hint={`${toPersianDigits(data.completedCount)} تکمیل‌شده`}
            />
            <AdminKpiCard
              icon={Wallet}
              label="پرداخت اشتراک"
              value={formatPrice(data.payments.paidAmountToman)}
              tone="success"
            />
            <AdminKpiCard
              icon={Receipt}
              label="بازپرداخت"
              value={formatPrice(data.payments.refundedAmountToman)}
              hint={`${toPersianDigits(data.payments.failedCount)} پرداخت ناموفق`}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <AdminMonthlyGmvChart monthlyGmv={data.monthlyGmv} />
            <AdminSectionCard>
              <h2 className="mb-3 text-sm font-semibold">خدمات برتر (GMV)</h2>
              <AdminDataTable
                columns={columns}
                emptyTitle="خدمتی در این بازه نیست."
                getRowId={(row) => row.serviceId}
                loading={false}
                rows={data.topServices}
              />
            </AdminSectionCard>
          </div>

          <AdminSectionCard>
            <h2 className="mb-2 text-sm font-semibold">خلاصه پرداخت‌ها</h2>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">پرداخت‌شده</dt>
                <dd className="text-sm font-medium">
                  {formatPrice(data.payments.paidAmountToman)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">ناموفق (مبلغ)</dt>
                <dd className="text-sm font-medium">
                  {formatPrice(data.payments.failedAmountToman)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">تعداد ناموفق</dt>
                <dd className="text-sm font-medium">
                  {toPersianDigits(data.payments.failedCount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">بازپرداخت‌شده</dt>
                <dd className="text-sm font-medium">
                  {formatPrice(data.payments.refundedAmountToman)}
                </dd>
              </div>
            </dl>
          </AdminSectionCard>
        </>
      ) : null}
    </div>
  );
}
