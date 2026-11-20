import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, Server, XCircle } from "lucide-react";

import { RefreshStatusButton, RunJobButton } from "@/components/admin/settings/system-actions";
import { AdminForbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/shell/page-header";
import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { Ltr } from "@/components/admin/ui/ltr";
import { DescriptionList, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime, formatRelative } from "@/lib/admin/format";
import type { Tone } from "@/lib/admin/labels";
import { ADMIN_PERMISSIONS, can } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { getAdminPageSession } from "@/server/modules/admin/auth/admin-viewer";
import { getSystemStatus } from "@/server/modules/admin/settings/settings-admin.service";

export const metadata: Metadata = { title: "وضعیت سامانه" };
export const dynamic = "force-dynamic";

const JOB_STATUS: Record<string, { label: string; tone: Tone }> = {
  completed: { label: "موفق", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  never: { label: "هنوز اجرا نشده", tone: "neutral" },
  running: { label: "در حال اجرا", tone: "info" },
  stale: { label: "متوقف‌شده (مهلت تمام شده)", tone: "warning" },
};

const DELIVERY_STATUS: Record<string, string> = {
  delivered: "تحویل‌شده",
  failed: "ناموفق",
  queued: "در صف",
  sent: "ارسال‌شده",
  skipped: "رد شده",
};

const CHANNEL: Record<string, string> = { in_app: "درون‌برنامه", push: "اعلان push", sms: "پیامک" };

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${faNumber(ms)} میلی‌ثانیه`;
  return `${faNumber(Math.round(ms / 100) / 10)} ثانیه`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${faNumber(days)} روز و ${faNumber(hours)} ساعت`;
  if (hours > 0) return `${faNumber(hours)} ساعت و ${faNumber(minutes)} دقیقه`;
  return `${faNumber(minutes)} دقیقه`;
}

export default async function AdminSystemStatusPage() {
  const session = await getAdminPageSession();
  if (!session || !can(session.viewer.access, ADMIN_PERMISSIONS.settingsView)) {
    return <AdminForbidden section="تنظیمات" />;
  }
  const status = await getSystemStatus();
  const now = new Date(status.checkedAt);
  const unhealthyJobs = status.jobs.filter((job) => !job.legacy && (job.status === "failed" || job.status === "stale")).length;

  return (
    <>
      <PageHeader
        actions={
          <>
            <RefreshStatusButton />
            <RunJobButton job="all" />
          </>
        }
        breadcrumbs={[{ label: "تنظیمات" }, { label: "وضعیت سامانه" }]}
        description={`آخرین بررسی: ${formatDateTime(status.checkedAt)}. اطلاعات محرمانه (رمزها و توکن‌ها) هرگز اینجا نمایش داده نمی‌شوند.`}
        title="وضعیت سامانه"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={status.database.ok ? <CheckCircle2 /> : <XCircle />}
          label="پایگاه داده"
          sub={status.database.ok ? `MySQL ${status.database.version ?? ""}` : (status.database.error ?? "")}
          tone={status.database.ok ? "success" : "danger"}
          value={status.database.ok ? `${faNumber(status.database.latencyMs ?? 0)} میلی‌ثانیه` : "در دسترس نیست"}
        />
        <Tile icon={<Server />} label="نسخه برنامه" sub={`محیط ${status.app.appEnv}`} tone="neutral" value={<Ltr>{status.app.version}</Ltr>} />
        <Tile
          icon={unhealthyJobs > 0 ? <AlertTriangle /> : <CheckCircle2 />}
          label="کارهای پس‌زمینه"
          sub={unhealthyJobs > 0 ? `${faNumber(unhealthyJobs)} کار نیاز به بررسی دارد` : "همه کارها سالم‌اند"}
          tone={unhealthyJobs > 0 ? "warning" : "success"}
          value={`${faNumber(status.jobs.filter((job) => !job.legacy).length)} کار`}
        />
        <Tile
          icon={status.deliveries.failed > 0 ? <AlertTriangle /> : <Clock3 />}
          label="صف اعلان‌ها"
          sub={status.deliveries.failed > 0 ? `${faNumber(status.deliveries.failed)} ارسال ناموفق` : "ارسال ناموفقی نیست"}
          tone={status.deliveries.failed > 0 ? "warning" : "neutral"}
          value={`${faNumber(status.deliveries.queued)} در صف`}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Panel className="overflow-hidden">
            <PanelHeader
              description="کارهای زمان‌بندی‌شده با اجراکننده‌ی سامانه (scripts/run-jobs) یا از همین‌جا اجرا می‌شوند. اگر کاری هم‌زمان در جای دیگری در حال اجرا باشد، اجرای دوباره نادیده گرفته می‌شود."
              title="کارهای پس‌زمینه"
            />
            <ul className="divide-y divide-line border-t border-line">
              {status.jobs.map((job) => {
                const meta = JOB_STATUS[job.status] ?? { label: job.status, tone: "neutral" as const };
                return (
                  <li className={cn("flex flex-wrap items-start gap-3 px-5 py-4", job.legacy && "opacity-70")} key={job.name}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {job.status === "never" ? <CircleDashed className="size-4" /> : <Clock3 className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-bold">{job.label}</span>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {job.legacy ? <Badge dot={false}>قدیمی</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{job.description}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                        <span className="font-mono" dir="ltr">
                          {job.name}
                        </span>
                        {job.startedAt ? (
                          <span title={formatDateTime(job.startedAt)}>آخرین شروع: {formatRelative(job.startedAt, now)}</span>
                        ) : null}
                        {job.durationMs !== null ? <span>مدت: {formatDuration(job.durationMs)}</span> : null}
                        {job.status === "running" && job.leaseExpiresAt ? (
                          <span>
                            در اختیار <Ltr>{job.leaseOwner}</Ltr> تا {formatDateTime(job.leaseExpiresAt)}
                          </span>
                        ) : null}
                      </p>
                      {job.errorMessage ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[12px] font-semibold text-danger">آخرین خطا</summary>
                          <pre className="admin-scroll mt-1.5 max-h-40 overflow-auto rounded-lg bg-danger-soft px-3 py-2 text-left font-mono text-[11.5px] leading-5 whitespace-pre-wrap text-danger" dir="ltr">
                            {job.errorMessage}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                    {job.legacy ? null : <RunJobButton job={job.name} label={job.label} />}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              action={
                <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/admins/notifications">
                  مدیریت اعلان‌ها
                </Link>
              }
              description={
                status.deliveries.oldestQueuedAt
                  ? `قدیمی‌ترین مورد در صف: ${formatRelative(status.deliveries.oldestQueuedAt, now)}`
                  : "صف ارسال خالی است."
              }
              title="ارسال اعلان‌ها"
            />
            {status.deliveries.byStatus.length === 0 ? (
              <p className="border-t border-line px-5 py-6 text-center text-[13px] text-muted-foreground">هنوز اعلانی ارسال نشده است.</p>
            ) : (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-right text-[11.5px] text-muted-foreground">
                      <th className="py-2.5 pr-5 pl-3 font-semibold" scope="col">کانال</th>
                      <th className="px-3 font-semibold" scope="col">وضعیت</th>
                      <th className="pl-5 font-semibold" scope="col">تعداد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.deliveries.byStatus.map((row) => (
                      <tr className="border-b border-line last:border-0" key={`${row.channel}-${row.status}`}>
                        <td className="py-2.5 pr-5 pl-3">{CHANNEL[row.channel] ?? row.channel}</td>
                        <td className={cn("px-3", row.status === "failed" && "font-semibold text-danger")}>
                          {DELIVERY_STATUS[row.status] ?? row.status}
                        </td>
                        <td className="pl-5 tabular-nums">{faNumber(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-5">
          <Panel>
            <PanelHeader title="سرویس‌های وابسته" />
            <ul className="grid gap-3 px-5 pb-5">
              {status.integrations.map((integration) => (
                <li className="rounded-xl border border-line p-3" key={integration.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-bold">{integration.label}</span>
                    <Badge tone={integration.tone}>{integration.mode}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{integration.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="سرور" />
            <div className="px-5 pb-5">
              <DescriptionList
                items={[
                  { label: "محیط", value: <Ltr>{status.app.appEnv}</Ltr> },
                  { label: "NODE_ENV", value: <Ltr>{status.app.nodeEnv}</Ltr> },
                  { label: "نسخه Node.js", value: <Ltr>{status.app.nodeVersion}</Ltr> },
                  { label: "مدت روشن بودن پروسه", value: formatUptime(status.app.uptimeSeconds) },
                  { label: "ساعت سرور", value: formatDateTime(status.app.serverTime) },
                  { label: "منطقه زمانی", value: <Ltr>{status.app.timeZone}</Ltr> },
                ]}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              description="از زمان روشن شدن همین پروسه؛ با هر راه‌اندازی دوباره صفر می‌شوند."
              title="شمارنده‌ها"
            />
            <div className="px-5 pb-5">
              {status.metrics.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">هنوز شمارنده‌ای ثبت نشده است.</p>
              ) : (
                <details>
                  <summary className="cursor-pointer text-[12.5px] font-semibold">
                    {faNumber(status.metrics.length)} شمارنده
                  </summary>
                  <ul className="admin-scroll mt-2 max-h-72 overflow-auto rounded-lg bg-raised p-2 font-mono text-[11.5px] leading-6" dir="ltr">
                    {status.metrics.map((metric) => (
                      <li className="flex justify-between gap-3" key={metric.name}>
                        <span className="truncate">{metric.name}</span>
                        <span className="tabular-nums">{metric.value}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Tile({
  icon,
  label,
  sub,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  tone: Tone;
  value: React.ReactNode;
}) {
  const toneClass: Record<Tone, string> = {
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
    neutral: "bg-muted text-muted-foreground",
    success: "bg-ok-soft text-ok",
    warning: "bg-warn-soft text-warn",
    wheat: "bg-wheat-soft text-wheat-ink",
  };
  return (
    <Panel className="flex items-start gap-3 p-4">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", toneClass[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[17px] font-extrabold">{value}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground" title={sub}>
          {sub}
        </p>
      </div>
    </Panel>
  );
}
