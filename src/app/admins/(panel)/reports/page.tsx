import type { Metadata } from "next";

import "@/components/admin/reports/reports-viz.css";

import { GrowthTab } from "@/components/admin/reports/growth-tab";
import { MarketplaceTab } from "@/components/admin/reports/marketplace-tab";
import { PeriodBar } from "@/components/admin/reports/period-bar";
import { ProvidersTab } from "@/components/admin/reports/providers-tab";
import { formatDay } from "@/components/admin/reports/report-format";
import { periodQuery } from "@/components/admin/reports/report-parts";
import { ReportTabs } from "@/components/admin/reports/report-tabs";
import { RevenueTab } from "@/components/admin/reports/revenue-tab";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { systemClock } from "@/server/clock/clock";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import {
  formatJalaliInput,
  ReportPeriodError,
  resolvePeriod,
  type ReportPeriod,
} from "@/server/modules/admin/reports/report-period";
import { ReportsQuerySchema } from "@/server/modules/admin/reports/reports-admin.schemas";
import {
  getGrowthReport,
  getMarketplaceReport,
  getProvidersReport,
  getRevenueReport,
} from "@/server/modules/admin/reports/reports-admin.service";

export const metadata: Metadata = { title: "گزارش‌ها" };

const BUCKET_TEXT = { day: "روزانه", month: "ماهانه", week: "هفتگی" } as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.reportsView)) {
    return <AdminForbidden section="گزارش‌ها" />;
  }
  const canExport = can(session.viewer.access, ADMIN_PERMISSIONS.reportsExport);

  const raw = await searchParams;
  const query = ReportsQuerySchema.parse(
    Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])),
  );
  const now = systemClock.now();

  let period: ReportPeriod;
  let periodError: string | null = null;
  try {
    period = resolvePeriod(query, now);
  } catch (error) {
    if (!(error instanceof ReportPeriodError)) throw error;
    periodError = error.message;
    period = resolvePeriod({ period: "30d" }, now);
  }

  const tabQuery = periodQuery(period);
  const content =
    query.tab === "marketplace" ? (
      <MarketplaceTab canExport={canExport} period={period} report={await getMarketplaceReport(period)} />
    ) : query.tab === "revenue" ? (
      <RevenueTab canExport={canExport} period={period} report={await getRevenueReport(period, now)} />
    ) : query.tab === "providers" ? (
      <ProvidersTab canExport={canExport} period={period} report={await getProvidersReport(period)} />
    ) : (
      <GrowthTab canExport={canExport} period={period} report={await getGrowthReport(period)} />
    );

  return (
    <>
      <PageHeader
        description="رشد، بازار درخواست‌ها، درآمد اشتراک و عملکرد خدمات‌دهندگان در هر بازه دلخواه، با مقایسه با بازه هم‌اندازه قبل."
        title="گزارش‌ها"
      />
      <div className="grid gap-5">
        <PeriodBar
          current={period.preset}
          customFrom={formatJalaliInput(period.from)}
          customTo={formatJalaliInput(period.to)}
          error={periodError}
          rangeText={
            <>
              <span className="font-semibold text-foreground">
                {formatDay(period.from)} تا {formatDay(period.to)}
              </span>{" "}
              ({faNumber(period.days)} روز، نمودارها {BUCKET_TEXT[period.bucket]}) · مقایسه با {formatDay(period.previous.from)} تا{" "}
              {formatDay(period.previous.to)}
            </>
          }
        />
        <ReportTabs current={query.tab} query={tabQuery} />
        {content}
      </div>
    </>
  );
}
