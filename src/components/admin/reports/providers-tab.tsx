import Link from "next/link";

import { Avatar } from "@/components/admin/ui/avatar";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatToman } from "@/lib/admin/format";
import type { ReportPeriod } from "@/server/modules/admin/reports/report-period";
import type { ProvidersReport } from "@/server/modules/admin/reports/reports-admin.service";

import { KpiTiles } from "./kpi-tiles";
import { faDecimal, formatDuration } from "./report-format";
import { ExportLink, ReportSection, SegmentedBar, TABLE, toneColor } from "./report-parts";

export function ProvidersTab({
  canExport,
  period,
  report,
}: {
  canExport: boolean;
  period: ReportPeriod;
  report: ProvidersReport;
}) {
  const { kpis } = report;

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <KpiTiles
          items={[
            {
              ...kpis.invitationsSent,
              hint: "تعداد ارسال درخواست برای خدمات‌دهندگان در این بازه (هر درخواست ممکن است برای چند نفر ارسال شود).",
              kind: "count",
              label: "درخواست ارسالی به خدمات‌دهندگان",
            },
            {
              ...kpis.acceptanceRate,
              hint: "از ارسال‌هایی که پاسخ گرفته‌اند (پذیرش یا رد)، چند درصد پذیرفته شده‌اند. ارسال‌های بی‌پاسخ و برداشته‌شده حساب نمی‌شوند.",
              kind: "percent",
              label: "نرخ پذیرش",
            },
            {
              ...kpis.medianResponse,
              hint: "میانه فاصله ارسال درخواست تا پاسخ خدمات‌دهنده (پذیرش یا رد).",
              kind: "duration",
              label: "زمان پاسخ (میانه)",
              lowerIsBetter: true,
            },
            {
              ...kpis.workingProviders,
              hint: "خدمات‌دهندگانی که دست‌کم یک کار در این بازه به انجام رسانده‌اند.",
              kind: "count",
              label: "خدمات‌دهنده دارای کار",
            },
          ]}
        />
        <div className="flex justify-end">
          <ExportLink canExport={canExport} dataset="providers-summary" period={period} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSection description="سرنوشت درخواست‌هایی که در این بازه برای خدمات‌دهندگان ارسال شده‌اند." title="پاسخ به درخواست‌ها">
          {report.invitations.sent === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">در این بازه درخواستی ارسال نشده است.</p>
          ) : (
            <SegmentedBar
              items={[
                { color: toneColor("success"), label: "پذیرفته", value: report.invitations.accepted },
                { color: toneColor("danger"), label: "ردشده", value: report.invitations.rejected },
                { color: toneColor("warning"), label: "بی‌پاسخ", value: report.invitations.waiting },
                { color: toneColor("neutral"), label: "برداشته‌شده", value: report.invitations.removed },
              ]}
              label="سهم هر پاسخ از درخواست‌های ارسالی"
            />
          )}
        </ReportSection>
        <ReportSection description="میانگین‌ها برای همین بازه." title="فعالیت خدمات‌دهندگان">
          <dl className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="text-[11.5px] text-muted-foreground">خدمات‌دهنده دعوت‌شده</dt>
              <dd className="mt-1 text-lg font-extrabold">{faNumber(kpis.invitedProviders.current)}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-muted-foreground">کار به ازای هر خدمات‌دهنده فعال</dt>
              <dd className="mt-1 text-lg font-extrabold">{faDecimal(kpis.jobsPerProvider.current)}</dd>
            </div>
          </dl>
        </ReportSection>
      </div>

      <ReportSection
        action={<ExportLink canExport={canExport} dataset="providers-leaderboard" period={period} />}
        description="مرتب بر اساس کارهای انجام‌شده و سپس ارزش کارها؛ ۲۵ نفر اول. فهرست کامل در خروجی CSV است."
        title="خدمات‌دهندگان برتر"
      >
        {report.leaderboard.length === 0 ? (
          <EmptyState title="در این بازه خدمات‌دهنده‌ای فعالیت نداشته است" />
        ) : (
          <div className="admin-scroll -mx-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr>
                  <th className={`${TABLE.th} w-10 pr-5`} scope="col">#</th>
                  <th className={TABLE.th} scope="col">خدمات‌دهنده</th>
                  <th className={TABLE.th} scope="col">کار انجام‌شده</th>
                  <th className={TABLE.th} scope="col">ارزش کارها</th>
                  <th className={TABLE.th} scope="col">درخواست دریافتی</th>
                  <th className={TABLE.th} scope="col">نرخ پذیرش</th>
                  <th className={`${TABLE.th} pl-5`} scope="col">میانگین زمان پاسخ</th>
                </tr>
              </thead>
              <tbody>
                {report.leaderboard.map((row, index) => (
                  <tr className={TABLE.tr} key={row.id}>
                    <td className={`${TABLE.td} pr-5 text-muted-foreground tabular-nums`}>{faNumber(index + 1)}</td>
                    <td className={TABLE.td}>
                      <Link
                        className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        href={`/admins/providers/${row.id}`}
                      >
                        <Avatar image={row.image} name={row.name} seed={row.id} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold hover:underline">{row.name}</span>
                          <span className="block text-[11.5px] text-muted-foreground">
                            <PhoneText phone={row.phone} />
                            {row.province ? ` · ${row.province}` : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${TABLE.td} tabular-nums font-semibold`}>{faNumber(row.jobs)}</td>
                    <td className={`${TABLE.td} tabular-nums`}>{row.gmv ? formatToman(row.gmv) : "—"}</td>
                    <td className={`${TABLE.td} tabular-nums`}>
                      {faNumber(row.sent)}
                      {row.sent ? (
                        <span className="mr-1.5 text-[11.5px] text-muted-foreground">
                          ({faNumber(row.accepted)} پذیرفته، {faNumber(row.rejected)} رد)
                        </span>
                      ) : null}
                    </td>
                    <td className={`${TABLE.td} tabular-nums`}>
                      {row.acceptanceRate === null ? "—" : `${faDecimal(row.acceptanceRate)}٪`}
                    </td>
                    <td className={`${TABLE.td} pl-5 tabular-nums`}>{formatDuration(row.responseSeconds)}</td>
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
