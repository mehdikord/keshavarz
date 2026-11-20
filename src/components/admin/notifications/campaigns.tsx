import { ChevronLeft, Link2, Megaphone } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime, formatPercent, formatRelative } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type {
  AdminCampaignDetail,
  CampaignSummary,
} from "@/server/modules/admin/notifications/notifications-admin.service";

import { audienceLabel, CHANNEL, DELIVERY_STATUS, deepLinkLabel, SKIP_REASON } from "./notification-labels";

/** Read share as a thin bar; delivery problems are called out next to it. */
export function ReadMeter({ read, total }: { read: number; total: number }) {
  const share = total > 0 ? (read / total) * 100 : 0;
  return (
    <div className="grid min-w-28 gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
        <span className="font-semibold tabular-nums text-foreground">{formatPercent(share)}</span>
        <span className="text-muted-foreground tabular-nums">
          {faNumber(read)} از {faNumber(total)}
        </span>
      </div>
      <div
        aria-label={`${formatPercent(share)} خوانده شده`}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="img"
      >
        <div className="h-full rounded-full bg-ok" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function DeliverySummary({ campaign }: { campaign: Pick<CampaignSummary, "delivered" | "failed" | "queued" | "skipped"> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {campaign.delivered > 0 ? <Badge tone="success">{faNumber(campaign.delivered)} تحویل</Badge> : null}
      {campaign.queued > 0 ? <Badge tone="info">{faNumber(campaign.queued)} در صف</Badge> : null}
      {campaign.failed > 0 ? <Badge tone="danger">{faNumber(campaign.failed)} ناموفق</Badge> : null}
      {campaign.skipped > 0 ? <Badge tone="neutral">{faNumber(campaign.skipped)} رد شد</Badge> : null}
    </div>
  );
}

export function CampaignsTable({ canSend, items, now }: { canSend: boolean; items: CampaignSummary[]; now: Date }) {
  if (items.length === 0) {
    return (
      <EmptyState
        action={
          canSend ? (
            <Link className={buttonVariants()} href="/admins/notifications/new">
              ارسال اولین اعلان
            </Link>
          ) : undefined
        }
        description="اعلان‌هایی که از این بخش برای کاربران می‌فرستید، با آمار خوانده‌شدن اینجا ثبت می‌شوند."
        icon={<Megaphone />}
        title="هنوز اعلانی از پنل ارسال نشده است"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">اعلان</th>
              <th className="px-3 font-semibold" scope="col">گیرندگان</th>
              <th className="px-3 font-semibold" scope="col">خوانده‌شده</th>
              <th className="px-3 font-semibold" scope="col">تحویل</th>
              <th className="px-3 font-semibold" scope="col">فرستنده</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((campaign) => (
              <tr className="group relative border-b border-line last:border-0 hover:bg-raised/70" key={campaign.campaignId}>
                <td className="max-w-[340px] py-3 pr-5 pl-3">
                  <Link
                    className="block truncate font-bold text-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                    href={`/admins/notifications/campaigns/${campaign.campaignId}`}
                  >
                    {campaign.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{campaign.body}</p>
                </td>
                <td className="px-3">
                  <p className="font-semibold">{audienceLabel(campaign.audience)}</p>
                  <p className="text-[11.5px] text-muted-foreground tabular-nums">{faNumber(campaign.total)} نفر</p>
                </td>
                <td className="px-3">
                  <ReadMeter read={campaign.read} total={campaign.total} />
                </td>
                <td className="px-3">
                  <DeliverySummary campaign={campaign} />
                </td>
                <td className="px-3">
                  <p className="font-medium">{campaign.sender ?? "—"}</p>
                  <p className="text-[11.5px] text-muted-foreground" title={formatDateTime(campaign.createdAt)}>
                    {formatRelative(campaign.createdAt, now)}
                  </p>
                </td>
                <td className="pl-4 text-muted-foreground">
                  <ChevronLeft className="size-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((campaign) => (
          <li className="relative px-4 py-3" key={campaign.campaignId}>
            <Link
              className="block truncate font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
              href={`/admins/notifications/campaigns/${campaign.campaignId}`}
            >
              {campaign.title}
            </Link>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {audienceLabel(campaign.audience)} · {faNumber(campaign.total)} نفر · {formatRelative(campaign.createdAt, now)}
            </p>
            <div className="mt-2">
              <ReadMeter read={campaign.read} total={campaign.total} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CampaignOverview({ summary }: { summary: CampaignSummary }) {
  const link = deepLinkLabel(summary.deepLink);
  const stats = [
    { label: "گیرندگان", value: faNumber(summary.total) },
    { label: "خوانده‌شده", value: faNumber(summary.read) },
    { label: "تحویل‌شده", value: faNumber(summary.delivered) },
    { label: "ناموفق", tone: summary.failed > 0 ? "text-danger" : undefined, value: faNumber(summary.failed) },
  ];
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--a-shadow-raise)]" key={stat.label}>
            <p className="text-[11.5px] font-medium text-muted-foreground">{stat.label}</p>
            <p className={cn("mt-1 text-[18px] font-extrabold tabular-nums", stat.tone)}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--a-shadow-raise)]">
        <p className="text-[11.5px] font-medium text-muted-foreground">متن ارسال‌شده</p>
        <p className="mt-2 text-[15px] font-extrabold">{summary.title}</p>
        <p className="mt-1.5 text-[13px] leading-7 whitespace-pre-line text-foreground/85">{summary.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3 text-[12px] text-muted-foreground">
          <span>
            گیرندگان: <span className="font-semibold text-foreground">{audienceLabel(summary.audience)}</span>
          </span>
          {summary.audience.kind === "user" && summary.audience.userId ? (
            <Link className="font-semibold text-foreground underline-offset-4 hover:underline" href={`/admins/users/${summary.audience.userId}`}>
              مشاهده حساب گیرنده
            </Link>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Link2 className="size-3.5" />
            {link ? `مقصد: ${link}` : "بدون پیوند"}
          </span>
          <span>
            فرستنده: <span className="font-semibold text-foreground">{summary.sender ?? "—"}</span>
          </span>
          <span>{formatDateTime(summary.createdAt)}</span>
          {summary.plannedRecipients !== summary.total ? (
            <span className="text-warn">
              برنامه‌ریزی‌شده برای {faNumber(summary.plannedRecipients)} نفر، ثبت‌شده برای {faNumber(summary.total)} نفر
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RecipientsTable({ now, recipients }: { now: Date; recipients: AdminCampaignDetail["recipients"] }) {
  if (recipients.items.length === 0) {
    return <EmptyState title={recipients.read === "all" ? "گیرنده‌ای ثبت نشده است" : "موردی با این فیلتر نیست"} />;
  }
  return (
    <ul className="divide-y divide-line">
      {recipients.items.map((row) => (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3" key={row.id}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {row.user ? (
              <>
                <Avatar image={row.user.image} name={row.user.name} seed={row.user.id} size={32} />
                <div className="min-w-0">
                  <Link className="block truncate text-[13px] font-semibold hover:underline" href={`/admins/users/${row.user.id}`}>
                    {row.user.name}
                  </Link>
                  <PhoneText className="text-[11.5px] text-muted-foreground" phone={row.user.phone} />
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">حساب حذف‌شده</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {row.deliveries.map((delivery) => {
              const meta = DELIVERY_STATUS[delivery.status] ?? { label: delivery.status, tone: "neutral" as const };
              return (
                <Badge
                  key={delivery.id}
                  tone={meta.tone}
                >
                  {CHANNEL[delivery.channel] ?? delivery.channel}: {meta.label}
                  {delivery.error ? <span className="sr-only">، {SKIP_REASON[delivery.error] ?? delivery.error}</span> : null}
                </Badge>
              );
            })}
          </div>
          <span className={cn("w-28 text-[12px]", row.readAt ? "text-ok" : "text-muted-foreground")} title={row.readAt ? formatDateTime(row.readAt) : undefined}>
            {row.readAt ? `خوانده شد ${formatRelative(row.readAt, now)}` : "خوانده نشده"}
          </span>
        </li>
      ))}
    </ul>
  );
}
