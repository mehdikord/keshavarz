import Link from "next/link";

import { CatalogThumb } from "@/components/admin/catalog/catalog-thumb";
import { Badge } from "@/components/admin/ui/badge";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatToman } from "@/lib/admin/format";
import { REQUEST_STATUS } from "@/lib/admin/labels";
import type { ReportPeriod } from "@/server/modules/admin/reports/report-period";
import type { MarketplaceReport, RequestStatus, ServiceRow } from "@/server/modules/admin/reports/reports-admin.service";

import { KpiTiles } from "./kpi-tiles";
import { formatDuration } from "./report-format";
import { BarList, ExportLink, ReportSection, SegmentedBar, TABLE, toneColor } from "./report-parts";
import { TrendChart } from "./trend-chart";

const STATUS_ORDER: RequestStatus[] = ["awaiting_send", "pending_provider", "in_progress", "completed", "cancelled"];

function SupplyBadge({ row }: { row: ServiceRow }) {
  if (row.created === 0) return <span className="text-[12px] text-muted-foreground">بدون تقاضا</span>;
  if (row.supply === 0) return <Badge tone="danger">بدون خدمات‌دهنده</Badge>;
  if (row.unmatched > 0) return <Badge tone="warning">کمبود عرضه</Badge>;
  return <Badge tone="success">پوشش داده شده</Badge>;
}

export function MarketplaceTab({
  canExport,
  period,
  report,
}: {
  canExport: boolean;
  period: ReportPeriod;
  report: MarketplaceReport;
}) {
  const { kpis } = report;
  const cancelledTotal = report.cancelledBy.admin + report.cancelledBy.consumer + report.cancelledBy.provider;
  const services = report.services.filter((row) => row.created > 0 || row.supply > 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <KpiTiles
          items={[
            { ...kpis.created, hint: "درخواست‌هایی که در این بازه ثبت شده‌اند، با هر وضعیتی.", kind: "count", label: "درخواست ثبت‌شده" },
            {
              ...kpis.gmv,
              hint: "جمع مبلغ توافقی کارهایی که در این بازه انجام شده‌اند (بر اساس تاریخ انجام). این مبلغ مستقیم بین طرفین پرداخت می‌شود.",
              kind: "money",
              label: "ارزش کارهای انجام‌شده",
            },
            {
              ...kpis.completionRate,
              hint: "از درخواست‌های ثبت‌شده در این بازه، چند درصد تا امروز انجام شده‌اند.",
              kind: "percent",
              label: "نرخ انجام",
            },
            {
              ...kpis.cancellationRate,
              hint: "از درخواست‌های ثبت‌شده در این بازه، چند درصد لغو شده‌اند.",
              kind: "percent",
              label: "نرخ لغو",
              lowerIsBetter: true,
            },
            {
              ...kpis.completed,
              hint: "کارهایی که در این بازه به وضعیت «انجام شد» رسیده‌اند (بر اساس تاریخ انجام).",
              kind: "count",
              label: "کار انجام‌شده",
            },
            {
              ...kpis.averageOrder,
              hint: "ارزش کارهای انجام‌شده تقسیم بر تعداد آن‌ها.",
              kind: "money",
              label: "میانگین مبلغ هر کار",
            },
            {
              ...kpis.medianToAccept,
              hint: "میانه فاصله ثبت درخواست تا پذیرش آن توسط یک خدمات‌دهنده، برای درخواست‌های ثبت‌شده در این بازه.",
              kind: "duration",
              label: "زمان تا پذیرش (میانه)",
              lowerIsBetter: true,
            },
            {
              ...kpis.unmatched,
              hint: "درخواست‌هایی که جستجو هیچ خدمات‌دهنده‌ای برایشان پیدا نکرد و برای کسی ارسال نشدند.",
              kind: "count",
              label: "درخواست بی‌پاسخ از نظر عرضه",
              lowerIsBetter: true,
            },
          ]}
        />
        <div className="flex justify-end">
          <ExportLink canExport={canExport} dataset="marketplace-summary" period={period} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ReportSection
          action={<ExportLink canExport={canExport} dataset="marketplace-series" period={period} />}
          description="درخواست‌های ثبت‌شده و کارهای انجام‌شده در هر بازه زمانی."
          title="درخواست و انجام"
        >
          <TrendChart
            ariaLabel="نمودار درخواست‌های ثبت‌شده و کارهای انجام‌شده"
            bucket={period.bucket}
            kind="count"
            points={report.series}
            series={[
              { key: "created", label: "درخواست ثبت‌شده", mark: "bar", slot: 1 },
              { key: "completed", label: "کار انجام‌شده", mark: "bar", slot: 2 },
            ]}
          />
        </ReportSection>
        <ReportSection description="مبلغ توافقی کارهای انجام‌شده، بر اساس تاریخ انجام." title="ارزش کارهای انجام‌شده">
          <TrendChart
            ariaLabel="نمودار ارزش کارهای انجام‌شده"
            bucket={period.bucket}
            kind="money"
            points={report.series}
            series={[{ key: "gmv", label: "ارزش کارها", mark: "bar", slot: 1 }]}
          />
        </ReportSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSection description="وضعیت امروزِ درخواست‌هایی که در این بازه ثبت شده‌اند." title="وضعیت درخواست‌ها">
          {kpis.created.current === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">در این بازه درخواستی ثبت نشده است.</p>
          ) : (
            <>
              <SegmentedBar
                items={STATUS_ORDER.map((status) => ({
                  color: toneColor(REQUEST_STATUS[status]?.tone ?? "neutral"),
                  label: REQUEST_STATUS[status]?.label ?? status,
                  value: report.statuses[status],
                }))}
                label="سهم هر وضعیت از درخواست‌های ثبت‌شده"
              />
              <p className="mt-4 text-[12px] text-muted-foreground">
                زمان تا انجام (میانه): <span className="font-semibold text-foreground">
                  {formatDuration(kpis.medianToComplete.current)}
                </span>
              </p>
            </>
          )}
        </ReportSection>
        <ReportSection
          description={`${faNumber(cancelledTotal)} درخواست از درخواست‌های این بازه لغو شده‌اند.`}
          title="چه کسی لغو کرد؟"
        >
          <BarList
            emptyText="در این بازه لغوی ثبت نشده است."
            items={[
              { label: "خدمات‌گیرنده", value: report.cancelledBy.consumer },
              { label: "خدمات‌دهنده", value: report.cancelledBy.provider },
              { label: "مدیر (پشتیبانی)", value: report.cancelledBy.admin },
            ]}
            slot={2}
          />
        </ReportSection>
      </div>

      <ReportSection
        action={<ExportLink canExport={canExport} dataset="marketplace-services" period={period} />}
        description="تقاضا در این بازه در کنار عرضه امروز: تعداد خدمات‌دهندگان فعالی که این خدمت را ارائه می‌کنند."
        title="عرضه و تقاضا به تفکیک خدمت"
      >
        {services.length === 0 ? (
          <EmptyState title="داده‌ای برای این بازه نیست" />
        ) : (
          <div className="admin-scroll -mx-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${TABLE.th} pr-5`} scope="col">خدمت</th>
                  <th className={TABLE.th} scope="col">درخواست</th>
                  <th className={TABLE.th} scope="col">انجام‌شده</th>
                  <th className={TABLE.th} scope="col">لغوشده</th>
                  <th className={TABLE.th} scope="col">بی‌خدمات‌دهنده</th>
                  <th className={TABLE.th} scope="col">ارزش انجام‌شده</th>
                  <th className={TABLE.th} scope="col">خدمات‌دهنده فعال</th>
                  <th className={`${TABLE.th} pl-5`} scope="col">وضعیت عرضه</th>
                </tr>
              </thead>
              <tbody>
                {services.map((row) => (
                  <tr className={TABLE.tr} key={row.id}>
                    <td className={`${TABLE.td} pr-5`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CatalogThumb image={row.image} name={row.name} size={32} />
                        <div className="min-w-0">
                          <Link
                            className="block truncate font-semibold underline-offset-4 hover:underline"
                            href={`/admins/requests?service=s:${row.id}`}
                          >
                            {row.name}
                          </Link>
                          <span className="block truncate text-[11.5px] text-muted-foreground">{row.categoryName}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.created)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.completed)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.cancelled)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.unmatched)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{row.gmv ? formatToman(row.gmv) : "—"}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{faNumber(row.supply)}</td>
                    <td className={`${TABLE.td} pl-5`}>
                      <SupplyBadge row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSection
          action={<ExportLink canExport={canExport} dataset="marketplace-categories" period={period} />}
          description="تعداد درخواست ثبت‌شده در هر دسته."
          title="دسته‌های پرتقاضا"
        >
          <BarList
            items={report.categories.slice(0, 10).map((row) => ({
              detail: row.completed ? `${faNumber(row.completed)} انجام‌شده` : undefined,
              label: row.name,
              value: row.created,
            }))}
          />
        </ReportSection>
        <ReportSection
          action={<ExportLink canExport={canExport} dataset="marketplace-provinces" period={period} />}
          description="بر اساس استانی که خدمات‌گیرنده در پروفایل خود ثبت کرده است."
          title="درخواست‌ها بر اساس استان"
        >
          <BarList
            items={report.provinces.slice(0, 10).map((row) => ({
              detail: row.completed ? `${faNumber(row.completed)} انجام‌شده` : undefined,
              label: row.name ?? "استان نامشخص",
              value: row.created,
            }))}
          />
        </ReportSection>
      </div>
    </div>
  );
}
