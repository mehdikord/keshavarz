import type { ReportPeriod } from "@/server/modules/admin/reports/report-period";
import type { GrowthReport } from "@/server/modules/admin/reports/reports-admin.service";

import { KpiTiles } from "./kpi-tiles";
import { BarList, ExportLink, ReportSection } from "./report-parts";
import { TrendChart } from "./trend-chart";

export function GrowthTab({
  canExport,
  period,
  report,
}: {
  canExport: boolean;
  period: ReportPeriod;
  report: GrowthReport;
}) {
  const { kpis } = report;
  const unknownProvince = report.provinces.find((row) => row.name === null);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <KpiTiles
          items={[
            {
              ...kpis.newUsers,
              hint: "حساب‌هایی که در این بازه ساخته شده‌اند (بدون حساب‌های حذف‌شده).",
              kind: "count",
              label: "کاربر جدید",
            },
            {
              ...kpis.newProviders,
              hint: "پروفایل‌های خدمات‌دهنده‌ای که در این بازه ساخته شده‌اند.",
              kind: "count",
              label: "خدمات‌دهنده جدید",
            },
            {
              ...kpis.activeUsers,
              hint: "کاربرانی که در این بازه وارد شده‌اند یا نشستشان فعالیت داشته است. برای بازه‌های قدیمی کمتر از واقع است، چون فقط آخرین فعالیت هر نشست نگه داشته می‌شود.",
              kind: "count",
              label: "کاربر فعال",
            },
            {
              ...kpis.totalUsers,
              hint: "تعداد کل حساب‌ها در پایان بازه؛ «قبل» یعنی در آغاز بازه.",
              kind: "count",
              label: "کل کاربران",
            },
          ]}
        />
        <div className="flex justify-end">
          <ExportLink canExport={canExport} dataset="growth-summary" period={period} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ReportSection
          action={<ExportLink canExport={canExport} dataset="growth-series" period={period} />}
          description="ثبت‌نام‌های تازه در هر بازه زمانی."
          title="ثبت‌نام"
        >
          <TrendChart
            ariaLabel="نمودار کاربر و خدمات‌دهنده جدید"
            bucket={period.bucket}
            kind="count"
            points={report.series}
            series={[
              { key: "newUsers", label: "کاربر جدید", mark: "bar", slot: 1 },
              { key: "newProviders", label: "خدمات‌دهنده جدید", mark: "bar", slot: 2 },
            ]}
          />
        </ReportSection>
        <ReportSection description="تعداد کل حساب‌ها در پایان هر بازه زمانی." title="رشد تجمعی">
          <TrendChart
            ariaLabel="نمودار تجمعی کاربران و خدمات‌دهندگان"
            bucket={period.bucket}
            kind="count"
            points={report.series}
            series={[
              { key: "totalUsers", label: "کل کاربران", mark: "line", slot: 1 },
              { key: "totalProviders", label: "کل خدمات‌دهندگان", mark: "line", slot: 2 },
            ]}
          />
        </ReportSection>
      </div>

      <ReportSection
        action={<ExportLink canExport={canExport} dataset="growth-provinces" period={period} />}
        description={
          unknownProvince
            ? `${unknownProvince.total.toLocaleString("fa-IR")} کاربر جدید هنوز استان خود را مشخص نکرده‌اند.`
            : "استانی که کاربر جدید در پروفایل خود ثبت کرده است."
        }
        title="کاربران جدید بر اساس استان"
      >
        <BarList
          items={report.provinces
            .filter((row) => row.name !== null)
            .slice(0, 12)
            .map((row) => ({
              detail: row.providers ? `${row.providers.toLocaleString("fa-IR")} خدمات‌دهنده` : undefined,
              label: row.name,
              value: row.total,
            }))}
        />
      </ReportSection>
    </div>
  );
}
