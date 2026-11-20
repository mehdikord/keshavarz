import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpLeft,
  BadgeCheck,
  CreditCard,
  Hourglass,
  MapPinned,
  Sprout,
  Tractor,
  UserRoundX,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge, toneDot } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatArea, formatPercent, formatRelative, formatToman, percentChange } from "@/lib/admin/format";
import { REQUEST_STATUS, REQUEST_STATUS_ORDER } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "@/server/modules/admin/dashboard/dashboard.service";

export function KpiStrip({ overview }: { overview: DashboardOverview }) {
  const weekChange = percentChange(overview.users.newWeek, overview.users.newPrevWeek);
  const items = [
    {
      hint:
        weekChange === null || weekChange === 0
          ? `${faNumber(overview.users.newWeek)} ثبت‌نام در ۷ روز اخیر`
          : `${faNumber(overview.users.newWeek)} ثبت‌نام این هفته، ${weekChange > 0 ? "+" : "−"}${formatPercent(weekChange)}`,
      icon: Users,
      label: "کاربران",
      value: faNumber(overview.users.total),
    },
    {
      hint: `${faNumber(overview.users.activeWeek)} نفر در ۷ روز اخیر وارد شده‌اند`,
      icon: BadgeCheck,
      label: "کاربران فعال هفته",
      value: faNumber(overview.users.activeWeek),
    },
    {
      hint: `${faNumber(overview.revenue.activeSubscriptions)} اشتراک فعال`,
      icon: Tractor,
      label: "خدمات‌دهندگان",
      value: faNumber(overview.users.providers),
    },
    {
      hint: `${formatArea(overview.lands.totalAreaSquareMeters)} زیر پوشش`,
      icon: Sprout,
      label: "زمین‌های ثبت‌شده",
      value: faNumber(overview.lands.total),
    },
  ];

  return (
    <Panel className="grid grid-cols-2 overflow-hidden lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          className={cn(
            "flex flex-col gap-3 p-5",
            index % 2 === 1 && "border-r border-line",
            index >= 2 && "border-t border-line lg:border-t-0",
            index === 2 && "lg:border-r",
          )}
          key={item.label}
        >
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-muted-foreground">
            <item.icon className="size-4" />
            {item.label}
          </div>
          <p className="text-[28px] leading-none font-extrabold tracking-tight">{item.value}</p>
          <p className="text-[11.5px] leading-5 text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </Panel>
  );
}

const STATUS_BAR: Record<string, string> = {
  awaiting_send: "bg-muted-foreground/35",
  cancelled: "bg-danger/70",
  completed: "bg-ok",
  in_progress: "bg-info",
  pending_provider: "bg-warn",
};

export function RequestPipeline({ overview }: { overview: DashboardOverview }) {
  const { byStatus, total } = overview.requests;
  return (
    <Panel>
      <PanelHeader
        action={
          <Link className="text-[12.5px] font-semibold text-primary hover:underline" href="/admins/requests">
            همه درخواست‌ها
          </Link>
        }
        description={`${faNumber(overview.requests.open)} درخواست باز، ${faNumber(overview.requests.completedMonth)} انجام‌شده در ۳۰ روز اخیر`}
        title="جریان درخواست‌ها"
      />
      <div className="px-5 pb-5">
        {total === 0 ? (
          <EmptyState description="هنوز هیچ درخواست خدمتی ثبت نشده است." title="درخواستی وجود ندارد" />
        ) : (
          <>
            <div aria-hidden className="flex h-3 overflow-hidden rounded-full bg-muted">
              {REQUEST_STATUS_ORDER.map((status) =>
                byStatus[status] > 0 ? (
                  <span
                    className={cn("h-full border-l-2 border-card first:border-l-0", STATUS_BAR[status])}
                    key={status}
                    style={{ width: `${(byStatus[status] / total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-5 grid gap-1">
              {REQUEST_STATUS_ORDER.map((status) => (
                <li className="flex items-center gap-3 rounded-lg py-1.5" key={status}>
                  <span className={cn("size-2.5 rounded-[3px]", STATUS_BAR[status])} />
                  <span className="flex-1 text-[13px]">{REQUEST_STATUS[status]?.label}</span>
                  <span className="text-[13px] font-bold">{faNumber(byStatus[status])}</span>
                  <span className="w-12 text-left text-[11.5px] text-muted-foreground">
                    {formatPercent((byStatus[status] / total) * 100)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}

export function AttentionList({ overview }: { overview: DashboardOverview }) {
  const items = [
    {
      count: overview.attention.pendingProviders,
      description: "پروفایل خدمات‌دهنده‌ای که هنوز تأیید نشده است",
      href: "/admins/providers?status=any",
      icon: Tractor,
      label: "خدمات‌دهنده در انتظار تأیید",
    },
    {
      count: overview.attention.staleRequests,
      description: "بیش از ۴۸ ساعت بدون پاسخ خدمات‌دهنده",
      href: "/admins/requests?status=pending_provider&sort=oldest",
      icon: Hourglass,
      label: "درخواست بی‌پاسخ",
    },
    {
      count: overview.attention.failedPaymentsWeek,
      description: "پرداخت ناموفق اشتراک در ۷ روز اخیر",
      href: "/admins/billing/payments?status=failed&period=7d",
      icon: CreditCard,
      label: "پرداخت ناموفق",
    },
    {
      count: overview.attention.restrictedUsers,
      description: "حساب‌هایی که الان تعلیق یا مسدود هستند",
      href: "/admins/users?status=suspended",
      icon: UserRoundX,
      label: "کاربر محدودشده",
    },
  ];
  const open = items.filter((item) => item.count > 0).length;

  return (
    <Panel>
      <PanelHeader
        description={open === 0 ? "همه‌چیز مرتب است." : `${faNumber(open)} مورد منتظر بررسی است`}
        title="نیاز به رسیدگی"
      />
      <ul className="px-3 pb-3">
        {items.map((item) => {
          const body = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  item.count > 0 ? "bg-wheat-soft text-wheat-ink" : "bg-muted text-muted-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{item.description}</span>
              </span>
              <span className={cn("text-lg font-extrabold", item.count === 0 && "text-muted-foreground/60")}>
                {faNumber(item.count)}
              </span>
              {item.href ? <ArrowUpLeft className="size-4 text-muted-foreground" /> : null}
            </>
          );
          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  href={item.href}
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2 py-2.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function RecentUsers({ now, overview }: { now: Date; overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader
        action={
          <Link className="text-[12.5px] font-semibold text-primary hover:underline" href="/admins/users">
            همه کاربران
          </Link>
        }
        title="تازه‌ترین کاربران"
      />
      {overview.recentUsers.length === 0 ? (
        <EmptyState icon={<Users />} title="هنوز کاربری ثبت‌نام نکرده است" />
      ) : (
        <ul className="px-3 pb-3">
          {overview.recentUsers.map((user) => (
            <li key={user.id}>
              <Link
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                href={`/admins/users/${user.id}`}
              >
                <Avatar image={user.image} name={user.name} seed={user.id} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold">{user.name}</span>
                    {user.isProvider ? <Badge dot={false} tone="info">خدمات‌دهنده</Badge> : null}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    <PhoneText phone={user.phone} />
                    {user.province ? ` در ${user.province}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] text-muted-foreground">{formatRelative(user.createdAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentRequests({ now, overview }: { now: Date; overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader
        action={
          <Link className="text-[12.5px] font-semibold text-primary hover:underline" href="/admins/requests">
            همه
          </Link>
        }
        title="تازه‌ترین درخواست‌ها"
      />
      {overview.recentRequests.length === 0 ? (
        <EmptyState title="هنوز درخواستی ثبت نشده است" />
      ) : (
        <ul className="px-3 pb-3">
          {overview.recentRequests.map((request) => {
            const status = REQUEST_STATUS[request.status];
            return (
              <li key={request.id}>
                <Link
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  href={`/admins/requests/${request.id}`}
                >
                  <span className={cn("size-2 shrink-0 rounded-full", toneDot(status?.tone ?? "neutral"))} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{request.serviceName}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {request.consumerName}، {formatRelative(request.createdAt, now)}
                    </span>
                  </span>
                  <span className="hidden text-left sm:block">
                    <Badge tone={status?.tone}>{status?.label ?? request.status}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function BarList({
  empty,
  items,
}: {
  empty: string;
  items: Array<{ count: number; label: string; sub?: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="grid gap-3 px-5 pb-5">
      {items.map((item) => (
        <li key={`${item.label}-${item.sub ?? ""}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-semibold">
              {item.label}
              {item.sub ? <span className="mr-1.5 text-[11.5px] font-normal text-muted-foreground">{item.sub}</span> : null}
            </span>
            <span className="font-bold">{faNumber(item.count)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/80" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TopServices({ overview }: { overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader
        action={
          <Link className="text-[12.5px] font-semibold text-primary hover:underline" href="/admins/reports?tab=marketplace">
            گزارش کامل
          </Link>
        }
        description="بر اساس تعداد درخواست در ۳۰ روز اخیر"
        title="پرتقاضاترین خدمات"
      />
      <BarList
        empty="در ۳۰ روز اخیر درخواستی ثبت نشده است"
        items={overview.topServices.map((service) => ({ count: service.count, label: service.name, sub: service.category }))}
      />
    </Panel>
  );
}

export function ProvinceSpread({ overview }: { overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader
        description={
          overview.provinces.unknown > 0
            ? `${faNumber(overview.provinces.unknown)} کاربر هنوز استان خود را مشخص نکرده‌اند`
            : "استان محل سکونت کاربران"
        }
        title="پراکندگی جغرافیایی"
        action={
          <Link className="text-[12.5px] font-semibold text-primary hover:underline" href="/admins/reports?tab=growth">
            گزارش کامل
          </Link>
        }
      />
      <BarList
        empty="هیچ کاربری استان خود را مشخص نکرده است"
        items={overview.provinces.top.map((province) => ({ count: province.count, label: province.name }))}
      />
    </Panel>
  );
}

export function RevenueNote({ overview }: { overview: DashboardOverview }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <CreditCard className="size-3.5" />
        درآمد ۳۰ روز اخیر:{" "}
        <Link className="font-bold text-foreground underline-offset-4 hover:underline" href="/admins/reports?tab=revenue">
          {formatToman(overview.revenue.paidMonth)}
        </Link>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <MapPinned className="size-3.5" />
        {formatArea(overview.lands.totalAreaSquareMeters)} زمین ثبت‌شده
      </span>
      {overview.requests.cancelledMonth > 0 ? (
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" />
          {faNumber(overview.requests.cancelledMonth)} درخواست لغوشده در ۳۰ روز اخیر
        </span>
      ) : null}
    </p>
  );
}
