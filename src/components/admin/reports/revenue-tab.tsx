import Link from "next/link";

import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatToman } from "@/lib/admin/format";
import type { ReportPeriod } from "@/server/modules/admin/reports/report-period";
import type { RevenueReport } from "@/server/modules/admin/reports/reports-admin.service";

import { KpiTiles } from "./kpi-tiles";
import { BarList, ExportLink, ReportSection, SegmentedBar, TABLE } from "./report-parts";
import { TrendChart } from "./trend-chart";

export function RevenueTab({
  canExport,
  period,
  report,
}: {
  canExport: boolean;
  period: ReportPeriod;
  report: RevenueReport;
}) {
  const { kpis } = report;
  // The payments list knows only rolling presets; other periods open the full list.
  const paymentsLink = ["7d", "30d", "90d"].includes(period.preset)
    ? `/admins/billing/payments?period=${period.preset}`
    : "/admins/billing/payments";

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <KpiTiles
          items={[
            {
              ...kpis.net,
              hint: "پرداخت‌های موفق اشتراک در این بازه منهای بازپرداخت‌های انجام‌شده در همین بازه.",
              kind: "money",
              label: "درآمد خالص",
            },
            {
              ...kpis.gross,
              hint: "جمع پرداخت‌های موفق اشتراک (بر اساس زمان پرداخت)، شامل پرداخت‌هایی که بعداً بازپرداخت شده‌اند.",
              kind: "money",
              label: "درآمد ناخالص",
            },
            {
              ...kpis.refunds,
              hint: `جمع بازپرداخت‌های ثبت‌شده در این بازه (${faNumber(report.refundCount)} مورد).`,
              kind: "money",
              label: "بازپرداخت",
              lowerIsBetter: true,
            },
            {
              ...kpis.activeSubscriptions,
              hint: "خدمات‌دهندگانی که در پایان بازه اشتراک در جریان داشتند؛ «قبل» یعنی در پایان بازه قبل.",
              kind: "count",
              label: "اشتراک فعال",
            },
            { ...kpis.payments, hint: "تعداد پرداخت‌های موفق اشتراک در این بازه.", kind: "count", label: "پرداخت موفق" },
            { ...kpis.averagePayment, hint: "درآمد ناخالص تقسیم بر تعداد پرداخت موفق.", kind: "money", label: "میانگین هر پرداخت" },
            {
              ...kpis.failedPayments,
              hint: "پرداخت‌هایی که در این بازه آغاز شدند و ناموفق ماندند.",
              kind: "count",
              label: "پرداخت ناموفق",
              lowerIsBetter: true,
            },
            {
              ...kpis.adminGrants,
              hint: "اشتراک‌هایی که مدیران در این بازه به‌صورت رایگان اعطا کرده‌اند.",
              kind: "count",
              label: "اشتراک اعطایی مدیر",
            },
          ]}
        />
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Link
            className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            href={paymentsLink}
          >
            فهرست پرداخت‌ها
          </Link>
          <ExportLink canExport={canExport} dataset="revenue-summary" period={period} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ReportSection
          action={<ExportLink canExport={canExport} dataset="revenue-series" period={period} />}
          description="پرداخت‌های موفق منهای بازپرداخت در هر بازه زمانی."
          title="درآمد خالص اشتراک"
        >
          <TrendChart
            ariaLabel="نمودار درآمد خالص اشتراک"
            bucket={period.bucket}
            kind="money"
            points={report.series}
            series={[{ key: "net", label: "درآمد خالص", mark: "bar", slot: 1 }]}
          />
        </ReportSection>
        <ReportSection description="خدمات‌دهندگانی که در پایان هر بازه زمانی اشتراک در جریان داشتند." title="اشتراک‌های فعال">
          <TrendChart
            ariaLabel="نمودار تعداد اشتراک‌های فعال"
            bucket={period.bucket}
            kind="count"
            points={report.series}
            series={[{ key: "activeSubscriptions", label: "اشتراک فعال", mark: "line", slot: 3 }]}
          />
        </ReportSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSection
          description="خرید اول: پرداخت‌کننده پیش از این پرداخت موفقی نداشته است. تمدید: پیش‌تر هم پرداخت کرده است."
          title="خرید اول در برابر تمدید"
        >
          {kpis.payments.current === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">در این بازه پرداخت موفقی ثبت نشده است.</p>
          ) : (
            <>
              <SegmentedBar
                items={[
                  { color: "var(--viz-1)", label: "خرید اول", value: report.split.first.amount },
                  { color: "var(--viz-2)", label: "تمدید", value: report.split.renewal.amount },
                ]}
                label="سهم خرید اول و تمدید از درآمد ناخالص"
              />
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                مقادیر به تومان؛ {faNumber(report.split.first.payments)} خرید اول و {faNumber(report.split.renewal.payments)} تمدید.
              </p>
            </>
          )}
        </ReportSection>
        <ReportSection description="اشتراک‌هایی که در این بازه شروع شده‌اند، بر اساس منبع." title="منبع اشتراک‌ها">
          <BarList
            emptyText="در این بازه اشتراکی شروع نشده است."
            items={[
              { label: "خرید", value: report.sources.purchases },
              { label: "اعطای مدیر", value: report.sources.adminGrants },
              { label: "طرح تشویقی", value: report.sources.promotions },
            ]}
            slot={3}
          />
        </ReportSection>
      </div>

      <ReportSection
        action={<ExportLink canExport={canExport} dataset="revenue-plans" period={period} />}
        description="درآمد ناخالص هر پلن در این بازه."
        title="درآمد به تفکیک پلن"
      >
        {report.plans.length === 0 ? (
          <EmptyState title="در این بازه پرداخت موفقی ثبت نشده است" />
        ) : (
          <div className="admin-scroll -mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${TABLE.th} pr-5`} scope="col">پلن</th>
                  <th className={TABLE.th} scope="col">پرداخت</th>
                  <th className={TABLE.th} scope="col">مبلغ کل</th>
                  <th className={TABLE.th} scope="col">خرید اول</th>
                  <th className={`${TABLE.th} pl-5`} scope="col">تمدید</th>
                </tr>
              </thead>
              <tbody>
                {report.plans.map((row) => (
                  <tr className={TABLE.tr} key={row.name}>
                    <td className={`${TABLE.td} pr-5 font-semibold`}>{row.name}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.payments)}</td>
                    <td className={`${TABLE.td} tabular-nums font-semibold`}>{formatToman(row.amount)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{formatToman(row.firstAmount)}</td>
                    <td className={`${TABLE.td} pl-5 tabular-nums`}>{formatToman(row.renewalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
    </div>
  );
}
