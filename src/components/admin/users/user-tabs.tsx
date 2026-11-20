import Link from "next/link";
import {
  Bell,
  ClipboardList,
  CreditCard,
  History,
  KeyRound,
  LogIn,
  MapPin,
  MonitorSmartphone,
  Receipt,
  ShieldAlert,
  Sprout,
} from "lucide-react";

import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { Ltr } from "@/components/admin/ui/ltr";
import { DescriptionList, EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { SatelliteThumb } from "@/components/shared/satellite-thumb";
import {
  faDigits,
  faNumber,
  formatArea,
  formatDate,
  formatDateTime,
  formatRelative,
  formatShortDate,
  formatToman,
} from "@/lib/admin/format";
import {
  DELIVERY_CHANNEL,
  INBOX_STATUS,
  MODERATION_ACTION,
  OTP_PURPOSE,
  PAYMENT_STATUS,
  PRICING_UNIT,
  REFUND_STATUS,
  REQUEST_STATUS,
  REQUEST_STATUS_ORDER,
  SESSION_PLATFORM,
  SUBSCRIPTION_SOURCE,
  SUBSCRIPTION_STATUS,
} from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type {
  AdminUserActivity,
  AdminUserHeader,
  AdminUserHistory,
  AdminUserLand,
  AdminUserNote,
  AdminUserNotification,
  AdminUserPayment,
  AdminUserProvider,
  AdminUserRequests,
  AdminUserSessions,
} from "@/server/modules/admin/users/users.service";

import { SessionRevokeButton } from "./session-revoke-button";
import { UserNotes } from "./user-notes";

const TH = "px-3 py-3 text-right text-[11.5px] font-semibold text-muted-foreground first:pr-5 last:pl-5";
const TD = "px-3 py-3 align-middle first:pr-5 last:pl-5";
const TR = "border-b border-line last:border-0";

function TableShell({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

function StatusBadge({ map, value }: { map: Record<string, { label: string; tone: Parameters<typeof Badge>[0]["tone"] }>; value: string }) {
  const meta = map[value];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? value}</Badge>;
}

// --------------------------------------------------------------- overview

const ACTIVITY_ICON = {
  land: Sprout,
  login: LogIn,
  moderation: ShieldAlert,
  payment: CreditCard,
  request: ClipboardList,
} as const;

function activityStatus(item: AdminUserActivity) {
  if (!item.status) return null;
  if (item.kind === "request") return <StatusBadge map={REQUEST_STATUS} value={item.status} />;
  if (item.kind === "payment") return <StatusBadge map={PAYMENT_STATUS} value={item.status} />;
  return null;
}

export function OverviewTab({
  activity,
  header,
  notes,
  now,
}: {
  activity: AdminUserActivity[];
  header: AdminUserHeader;
  notes: AdminUserNote[];
  now: Date;
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid gap-5">
        <Panel>
          <PanelHeader title="اطلاعات حساب" />
          <div className="px-5 pb-5">
            <DescriptionList
              items={[
                { label: "نام", value: header.name },
                {
                  label: "استان و شهر",
                  value: header.province ? `${header.province.name}${header.city ? `، ${header.city.name}` : ""}` : "مشخص نشده",
                },
                {
                  label: "تأیید شماره موبایل",
                  value: header.phoneVerifiedAt ? formatDateTime(header.phoneVerifiedAt) : "تأیید نشده",
                },
                {
                  label: "آخرین ورود",
                  value: header.lastLoginAt ? (
                    <>
                      {formatDateTime(header.lastLoginAt)}
                      {header.lastLoginIp ? (
                        <span className="mr-1.5 text-[12px] text-muted-foreground">
                          از <Ltr>{header.lastLoginIp}</Ltr>
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "هرگز"
                  ),
                },
                { label: "تاریخ عضویت", value: formatDateTime(header.createdAt) },
                { label: "آخرین به‌روزرسانی", value: formatDateTime(header.updatedAt) },
                { label: "زبان و منطقه زمانی", value: <Ltr>{`${header.locale} / ${header.timezone}`}</Ltr> },
                {
                  label: "خدمات‌دهندگی",
                  value: header.provider
                    ? header.provider.approvedAt
                      ? `تأییدشده در ${formatDate(header.provider.approvedAt)}${header.provider.isAvailable ? "، آماده پذیرش کار" : "، فعلاً پذیرای کار نیست"}`
                      : "پروفایل ساخته شده، در انتظار تأیید"
                    : "ندارد",
                },
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader description="آخرین رویدادهای این حساب، از جدید به قدیم" title="فعالیت اخیر" />
          {activity.length === 0 ? (
            <EmptyState icon={<History />} title="هنوز فعالیتی ثبت نشده است" />
          ) : (
            <ol className="relative px-5 pb-5">
              {activity.map((item, index) => {
                const Icon = ACTIVITY_ICON[item.kind];
                return (
                  <li className="relative flex gap-3.5 pb-5 last:pb-0" key={item.id}>
                    {index < activity.length - 1 ? (
                      <span aria-hidden className="absolute top-9 right-[15px] bottom-0 w-px bg-line" />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground",
                        item.kind === "moderation" && "border-warn/30 bg-warn-soft text-warn",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.href ? (
                          <Link
                            className="rounded text-[13px] font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            href={item.href}
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="text-[13px] font-semibold">{item.title}</span>
                        )}
                        {activityStatus(item)}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground" title={formatDateTime(item.at)}>
                        {formatRelative(item.at, now)}
                        {item.kind === "payment" && item.detail ? `، ${formatToman(item.detail)}` : ""}
                        {item.kind === "login" && item.detail ? `، ${item.detail}` : ""}
                      </p>
                      {item.kind === "moderation" && item.detail ? (
                        <p className="mt-1.5 rounded-lg bg-raised px-3 py-2 text-[12.5px] leading-6 text-foreground/85">
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
      <UserNotes notes={notes} now={now.toISOString()} userId={header.id} />
    </div>
  );
}

// ------------------------------------------------------------------ lands

function mapUrl(latitude: number, longitude: number) {
  return `https://neshan.org/maps/@${latitude},${longitude},16z`;
}

export function LandsTab({ lands, now }: { lands: AdminUserLand[]; now: Date }) {
  if (lands.length === 0) {
    return (
      <Panel>
        <EmptyState
          description="کاربر برای ثبت درخواست خدمت ابتدا باید زمین خود را روی نقشه ثبت کند."
          icon={<Sprout />}
          title="زمینی ثبت نشده است"
        />
      </Panel>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {lands.map((land) => (
        <Panel className={cn("overflow-hidden", land.deletedAt && "opacity-70")} key={land.id}>
          <a
            aria-label={`نمایش «${land.title}» روی نقشه`}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            href={mapUrl(land.latitude, land.longitude)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SatelliteThumb
              className="h-36 w-full"
              fallback={
                <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                  <MapPin className="size-6" />
                </div>
              }
              lat={land.latitude}
              lng={land.longitude}
              zoom={16}
            />
          </a>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-[14px] font-bold">{land.title}</h3>
              {land.deletedAt ? (
                <Badge tone="neutral">حذف‌شده</Badge>
              ) : !land.isActive ? (
                <Badge tone="neutral">غیرفعال</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {formatArea(land.areaSquareMeters)}، {faNumber(land.requestsCount)} درخواست خدمت
            </p>
            {land.description ? (
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-6 text-foreground/80">{land.description}</p>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <Ltr>{`${land.latitude.toFixed(5)}, ${land.longitude.toFixed(5)}`}</Ltr>
              <span title={formatDateTime(land.createdAt)}>{formatRelative(land.createdAt, now)}</span>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

// --------------------------------------------------------------- requests

export function RequestsTab({ data, header }: { data: AdminUserRequests; header: AdminUserHeader }) {
  const href = (params: { page?: number; status?: string }) => {
    const search = new URLSearchParams({ tab: "requests" });
    const status = params.status ?? data.status;
    if (status !== "all") search.set("rstatus", status);
    if (params.page && params.page > 1) search.set("rpage", String(params.page));
    return `/admins/users/${header.id}?${search.toString()}`;
  };
  const filters = [
    { count: header.counters.requests.total, key: "all", label: "همه" },
    ...REQUEST_STATUS_ORDER.map((status) => ({
      count: header.counters.requests[status],
      key: status,
      label: REQUEST_STATUS[status]!.label,
    })),
  ];

  return (
    <Panel className="overflow-hidden">
      <div className="admin-scroll flex gap-1.5 overflow-x-auto border-b border-line p-4">
        {filters.map((filter) => (
          <Link
            aria-current={data.status === filter.key ? "true" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              data.status === filter.key ? "bg-soil text-soil-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            href={href({ page: 1, status: filter.key })}
            key={filter.key}
            scroll={false}
          >
            {filter.label}
            <span className="opacity-70">{faNumber(filter.count)}</span>
          </Link>
        ))}
      </div>
      {data.items.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="درخواستی با این وضعیت وجود ندارد" />
      ) : (
        <TableShell minWidth={860}>
          <thead>
            <tr className="border-b border-line">
              <th className={TH}>خدمت</th>
              <th className={TH}>زمین</th>
              <th className={TH}>تاریخ‌های انجام</th>
              <th className={TH}>خدمات‌دهنده</th>
              <th className={TH}>مبلغ توافقی</th>
              <th className={TH}>ثبت</th>
              <th className={TH}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((request) => (
              <tr className={TR} key={request.id}>
                <td className={TD}>
                  <Link
                    className="block rounded font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`/admins/requests/${request.id}`}
                  >
                    {request.serviceName}
                  </Link>
                  <span className="text-[11.5px] text-muted-foreground">{request.category}</span>
                </td>
                <td className={TD}>{request.landTitle}</td>
                <td className={cn(TD, "text-[12px] text-muted-foreground")}>
                  {request.dates.length ? request.dates.map((date) => formatShortDate(`${date}T12:00:00Z`)).join("، ") : "—"}
                </td>
                <td className={TD}>
                  {request.providerName ?? (
                    <span className="text-[12px] text-muted-foreground">
                      {request.providersContacted ? `ارسال برای ${faNumber(request.providersContacted)} نفر` : "ارسال نشده"}
                    </span>
                  )}
                </td>
                <td className={TD}>{request.agreedPriceToman ? formatToman(request.agreedPriceToman) : "—"}</td>
                <td className={cn(TD, "text-[12px] text-muted-foreground")} title={formatDateTime(request.createdAt)}>
                  {formatShortDate(request.createdAt)}
                </td>
                <td className={TD}>
                  <StatusBadge map={REQUEST_STATUS} value={request.status} />
                  {request.status === "cancelled" && request.cancelReason ? (
                    <span className="mt-1 block max-w-48 truncate text-[11px] text-muted-foreground" title={request.cancelReason}>
                      {request.cancelledBy === "admin" ? "لغو مدیر" : request.cancelledBy === "provider" ? "لغو خدمات‌دهنده" : "لغو کاربر"}:{" "}
                      {request.cancelReason}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      {data.pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            صفحه {faNumber(data.page)} از {faNumber(data.pageCount)}
          </span>
          <div className="flex gap-2">
            {data.page > 1 ? (
              <Link className="rounded-lg px-3 py-1.5 font-semibold text-foreground hover:bg-muted" href={href({ page: data.page - 1 })} scroll={false}>
                صفحه قبل
              </Link>
            ) : null}
            {data.page < data.pageCount ? (
              <Link className="rounded-lg px-3 py-1.5 font-semibold text-foreground hover:bg-muted" href={href({ page: data.page + 1 })} scroll={false}>
                صفحه بعد
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

// --------------------------------------------------------------- provider

export function ProviderTab({ now, provider, userId }: { now: Date; provider: AdminUserProvider; userId: string }) {
  const inboxTotal = Object.values(provider.inbox).reduce((sum, count) => sum + count, 0);
  const accepted = provider.inbox.accepted ?? 0;
  const activeSubscription = provider.subscriptions.find(
    (subscription) => subscription.status === "active" && subscription.endsAt && new Date(subscription.endsAt) > now,
  );

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            action={
              <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/admins/providers/${userId}`}>
                مدیریت خدمات‌دهنده
              </Link>
            }
            title="پروفایل خدمات‌دهنده"
          />
          <div className="px-5 pb-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone={provider.approvedAt ? "success" : "wheat"}>{provider.approvedAt ? "تأییدشده" : "در انتظار تأیید"}</Badge>
              <Badge tone={provider.isActive ? "success" : "neutral"}>{provider.isActive ? "پروفایل فعال" : "پروفایل غیرفعال"}</Badge>
              <Badge tone={provider.isAvailable ? "info" : "neutral"}>{provider.isAvailable ? "آماده پذیرش کار" : "فعلاً کار نمی‌پذیرد"}</Badge>
            </div>
            <DescriptionList
              items={[
                {
                  label: "تأیید",
                  value: provider.approvedAt
                    ? `${formatDate(provider.approvedAt)}${provider.approvedBy ? ` به دست ${provider.approvedBy}` : ""}`
                    : "هنوز تأیید نشده",
                },
                { label: "ساخت پروفایل", value: formatDate(provider.createdAt) },
                {
                  label: "محدوده کاری",
                  value: provider.workArea ? (
                    <a
                      className="text-primary hover:underline"
                      href={mapUrl(provider.workArea.latitude, provider.workArea.longitude)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      شعاع {faNumber(provider.workArea.radiusKm)} کیلومتر، نمایش روی نقشه
                    </a>
                  ) : (
                    "مشخص نشده"
                  ),
                },
                { label: "تصاویر نمونه‌کار", value: `${faNumber(provider.galleryCount)} تصویر` },
                { label: "درباره خدمات‌دهنده", value: provider.bio || "توضیحی ننوشته است.", wide: true },
              ]}
            />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="کارنامه" />
          <dl className="grid grid-cols-2 gap-px bg-line">
            {[
              { label: "درخواست دریافتی", value: faNumber(inboxTotal) },
              { label: "نرخ پذیرش", value: inboxTotal ? `${faNumber(Math.round((accepted / inboxTotal) * 100))}٪` : "—" },
              { label: "کار انجام‌شده", value: faNumber(provider.jobs.completed ?? 0) },
              { label: "درآمد از کارها", value: formatToman(provider.revenue) },
            ].map((item) => (
              <div className="bg-card px-5 py-4" key={item.label}>
                <dt className="text-[11.5px] text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-lg font-extrabold">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-line px-5 py-4 text-[12.5px]">
            <p className="text-[11.5px] text-muted-foreground">اشتراک فعلی</p>
            <p className="mt-1 font-semibold">
              {activeSubscription
                ? `${activeSubscription.planName}، تا ${formatDate(activeSubscription.endsAt)}`
                : "اشتراک فعالی ندارد"}
            </p>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              {Object.entries(provider.inbox)
                .map(([status, count]) => `${INBOX_STATUS[status] ?? status}: ${faNumber(count)}`)
                .join("، ") || "هنوز درخواستی دریافت نکرده"}
            </p>
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader description="قیمت‌هایی که خدمات‌دهنده برای هر خدمت تعیین کرده" title={`خدمات ارائه‌شده (${faNumber(provider.services.length)})`} />
        {provider.services.length === 0 ? (
          <EmptyState title="هنوز خدمتی ثبت نکرده است" />
        ) : (
          <TableShell minWidth={640}>
            <thead>
              <tr className="border-y border-line">
                <th className={TH}>خدمت</th>
                <th className={TH}>قیمت</th>
                <th className={TH}>آخرین تغییر</th>
                <th className={TH}>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {provider.services.map((service) => (
                <tr className={TR} key={`${service.category}-${service.name}`}>
                  <td className={TD}>
                    <span className="block font-semibold">{service.name}</span>
                    <span className="text-[11.5px] text-muted-foreground">{service.category}</span>
                  </td>
                  <td className={TD}>
                    {formatToman(service.priceToman)}{" "}
                    <span className="text-[11.5px] text-muted-foreground">{PRICING_UNIT[service.pricingUnit] ?? service.pricingUnit}</span>
                  </td>
                  <td className={cn(TD, "text-[12px] text-muted-foreground")}>{formatShortDate(service.updatedAt)}</td>
                  <td className={TD}>
                    <Badge tone={service.isActive ? "success" : "neutral"}>{service.isActive ? "فعال" : "غیرفعال"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="اشتراک‌ها" />
          {provider.subscriptions.length === 0 ? (
            <EmptyState title="هنوز اشتراکی نداشته است" />
          ) : (
            <TableShell minWidth={560}>
              <thead>
                <tr className="border-y border-line">
                  <th className={TH}>طرح</th>
                  <th className={TH}>بازه</th>
                  <th className={TH}>منبع</th>
                  <th className={TH}>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {provider.subscriptions.map((subscription) => (
                  <tr className={TR} key={subscription.id}>
                    <td className={TD}>
                      <span className="block font-semibold">{subscription.planName}</span>
                      <span className="text-[11.5px] text-muted-foreground">{formatToman(subscription.amountToman)}</span>
                    </td>
                    <td className={cn(TD, "text-[12px] text-muted-foreground")}>
                      {subscription.startsAt ? `${formatShortDate(subscription.startsAt)} تا ${formatShortDate(subscription.endsAt)}` : "شروع نشده"}
                    </td>
                    <td className={cn(TD, "text-[12px]")}>
                      {SUBSCRIPTION_SOURCE[subscription.source] ?? subscription.source}
                      {subscription.grantedBy ? <span className="block text-[11px] text-muted-foreground">{subscription.grantedBy}</span> : null}
                    </td>
                    <td className={TD}>
                      <StatusBadge map={SUBSCRIPTION_STATUS} value={subscription.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader title="آخرین کارهای پذیرفته‌شده" />
          {provider.recentJobs.length === 0 ? (
            <EmptyState title="هنوز کاری به این خدمات‌دهنده سپرده نشده" />
          ) : (
            <ul className="px-3 pb-3">
              {provider.recentJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`/admins/requests/${job.id}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{job.serviceName}</span>
                      <span className="block text-[11.5px] text-muted-foreground">
                        برای {job.consumerName}، {formatRelative(job.createdAt, now)}
                        {job.agreedPriceToman ? `، ${formatToman(job.agreedPriceToman)}` : ""}
                      </span>
                    </span>
                    <StatusBadge map={REQUEST_STATUS} value={job.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- payments

export function PaymentsTab({ payments }: { payments: AdminUserPayment[] }) {
  return (
    <Panel className="overflow-hidden">
      {payments.length === 0 ? (
        <EmptyState
          description="پرداخت‌ها مربوط به خرید اشتراک خدمات‌دهندگی هستند."
          icon={<Receipt />}
          title="پرداختی ثبت نشده است"
        />
      ) : (
        <TableShell minWidth={820}>
          <thead>
            <tr className="border-b border-line">
              <th className={TH}>طرح</th>
              <th className={TH}>مبلغ</th>
              <th className={TH}>درگاه و پیگیری</th>
              <th className={TH}>تاریخ</th>
              <th className={TH}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr className={TR} key={payment.id}>
                <td className={TD}>
                  <Link
                    className="rounded font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`/admins/billing/payments/${payment.id}`}
                  >
                    {payment.planName ?? "اشتراک"}
                  </Link>
                  {payment.refunds.map((refund, index) => (
                    <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground" key={index}>
                      بازپرداخت {formatToman(refund.amountToman)}
                      <StatusBadge map={REFUND_STATUS} value={refund.status} />
                    </span>
                  ))}
                </td>
                <td className={cn(TD, "font-semibold")}>{formatToman(payment.amountToman)}</td>
                <td className={cn(TD, "text-[12px] text-muted-foreground")}>
                  <span className="block">{payment.gateway}</span>
                  {payment.reference ? <Ltr>{payment.reference}</Ltr> : payment.authority ? <Ltr>{payment.authority}</Ltr> : null}
                  {payment.failureMessage ? <span className="block text-danger">{payment.failureMessage}</span> : null}
                </td>
                <td className={cn(TD, "text-[12px] text-muted-foreground")}>
                  {formatDateTime(payment.paidAt ?? payment.createdAt)}
                </td>
                <td className={TD}>
                  <StatusBadge map={PAYMENT_STATUS} value={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </Panel>
  );
}

// --------------------------------------------------------------- sessions

function describeAgent(userAgent: string | null): string {
  if (!userAgent) return "مرورگر نامشخص";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : null;
  const os = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  return [browser, os].filter(Boolean).join(" روی ") || "مرورگر نامشخص";
}

export function SessionsTab({ data, now, userId }: { data: AdminUserSessions; now: Date; userId: string }) {
  return (
    <div className="grid gap-5">
      <Panel className="overflow-hidden">
        <PanelHeader
          description="هر دستگاهی که کاربر با آن وارد شده است. بستن نشست، کاربر را روی آن دستگاه خارج می‌کند."
          title="نشست‌ها و دستگاه‌ها"
        />
        {data.sessions.length === 0 ? (
          <EmptyState icon={<MonitorSmartphone />} title="کاربر هنوز وارد نشده است" />
        ) : (
          <TableShell minWidth={760}>
            <thead>
              <tr className="border-y border-line">
                <th className={TH}>دستگاه</th>
                <th className={TH}>آی‌پی</th>
                <th className={TH}>آخرین فعالیت</th>
                <th className={TH}>شروع</th>
                <th className={TH}>وضعیت</th>
                <th className={TH}>
                  <span className="sr-only">عملیات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session, index) => (
                <tr className={TR} key={session.id ?? `legacy-${index}`}>
                  <td className={TD}>
                    <span className="block font-semibold">{session.deviceName ?? describeAgent(session.userAgent)}</span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {SESSION_PLATFORM[session.platform] ?? session.platform}
                      {session.deviceName ? `، ${describeAgent(session.userAgent)}` : ""}
                    </span>
                  </td>
                  <td className={cn(TD, "text-[12px]")}>{session.ipAddress ? <Ltr>{session.ipAddress}</Ltr> : "—"}</td>
                  <td className={cn(TD, "text-[12px]")} title={formatDateTime(session.lastActivityAt)}>
                    {formatRelative(session.lastActivityAt, now)}
                  </td>
                  <td className={cn(TD, "text-[12px] text-muted-foreground")}>{formatShortDate(session.createdAt)}</td>
                  <td className={TD}>
                    {session.isActive ? (
                      <Badge tone="success">فعال</Badge>
                    ) : session.revokedAt ? (
                      <Badge tone="neutral">بسته‌شده</Badge>
                    ) : (
                      <Badge tone="neutral">منقضی</Badge>
                    )}
                  </td>
                  <td className={cn(TD, "text-left")}>
                    {session.isActive ? <SessionRevokeButton sessionId={session.id} userId={userId} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader
          description="برای بررسی شکایت «کد تأیید نمی‌رسد». خود کدها هرگز ذخیره نمی‌شوند."
          title="آخرین درخواست‌های کد تأیید"
        />
        {data.otps.length === 0 ? (
          <EmptyState icon={<KeyRound />} title="درخواست کدی ثبت نشده است" />
        ) : (
          <TableShell minWidth={620}>
            <thead>
              <tr className="border-y border-line">
                <th className={TH}>زمان</th>
                <th className={TH}>هدف</th>
                <th className={TH}>آی‌پی</th>
                <th className={TH}>تلاش‌ها</th>
                <th className={TH}>نتیجه</th>
              </tr>
            </thead>
            <tbody>
              {data.otps.map((otp) => (
                <tr className={TR} key={otp.id}>
                  <td className={cn(TD, "text-[12px]")}>{formatDateTime(otp.createdAt)}</td>
                  <td className={cn(TD, "text-[12px]")}>{OTP_PURPOSE[otp.purpose] ?? otp.purpose}</td>
                  <td className={cn(TD, "text-[12px]")}>{otp.requestedIp ? <Ltr>{otp.requestedIp}</Ltr> : "—"}</td>
                  <td className={cn(TD, "text-[12px]")}>
                    {faDigits(`${otp.attempts}/${otp.maxAttempts}`)}
                  </td>
                  <td className={TD}>
                    {otp.consumedAt ? (
                      <Badge tone="success">استفاده شد</Badge>
                    ) : otp.attempts >= otp.maxAttempts ? (
                      <Badge tone="danger">تلاش‌ها تمام شد</Badge>
                    ) : otp.expired ? (
                      <Badge tone="neutral">منقضی شد</Badge>
                    ) : (
                      <Badge tone="warning">در انتظار</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------- notifications

export function NotificationsTab({
  notifications,
  now,
  phone,
}: {
  notifications: AdminUserNotification[];
  now: Date;
  phone: string;
}) {
  return (
    <Panel>
      <PanelHeader
        action={
          <Link
            className={buttonVariants({ size: "sm", variant: "ghost" })}
            href={`/admins/notifications/all?q=${encodeURIComponent(phone)}`}
          >
            همه اعلان‌ها و وضعیت ارسال
          </Link>
        }
        title="اعلان‌های اخیر"
      />
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell />} title="اعلانی برای این کاربر ارسال نشده است" />
      ) : (
        <ul className="divide-y divide-line">
          {notifications.map((notification) => (
            <li className="flex gap-3 px-5 py-4" key={notification.id}>
              <span
                aria-label={notification.readAt ? "خوانده‌شده" : "خوانده‌نشده"}
                className={cn("mt-2 size-2 shrink-0 rounded-full", notification.readAt ? "bg-transparent" : "bg-wheat")}
                role="img"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold">{notification.title}</span>
                  {notification.channels.map((channel) => (
                    <Badge dot={false} key={channel.channel} tone={channel.status === "failed" ? "danger" : "neutral"}>
                      {DELIVERY_CHANNEL[channel.channel] ?? channel.channel}
                      {channel.status === "failed" ? "، ناموفق" : ""}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-[12.5px] leading-6 text-foreground/80">{notification.body}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {formatRelative(notification.createdAt, now)}
                  {notification.readAt ? `، خوانده‌شده ${formatRelative(notification.readAt, now)}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- history

const FIELD_LABELS: Record<string, string> = {
  action: "اقدام",
  body: "متن",
  cityId: "شهر",
  endsAt: "پایان",
  name: "نام",
  phone: "شماره موبایل",
  provinceId: "استان",
  reason: "دلیل",
};

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "خالی";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  if (typeof value === "string" && MODERATION_ACTION[value]) return MODERATION_ACTION[value]!.label;
  return faDigits(String(value));
}

function AuditChanges({ newValues, oldValues }: { newValues: Record<string, unknown> | null; oldValues: Record<string, unknown> | null }) {
  const keys = [...new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])].filter(
    (key) => key !== "note" && FIELD_LABELS[key],
  );
  const changed = keys.filter((key) =>
    oldValues
      ? JSON.stringify(oldValues[key]) !== JSON.stringify(newValues?.[key])
      : newValues?.[key] !== null && newValues?.[key] !== undefined,
  );
  if (changed.length === 0) return null;
  return (
    <dl className="mt-2 grid gap-1 rounded-lg bg-raised px-3 py-2 text-[12px]">
      {changed.map((key) => (
        <div className="flex flex-wrap gap-1.5" key={key}>
          <dt className="text-muted-foreground">{FIELD_LABELS[key]}:</dt>
          <dd>
            {oldValues && key in oldValues ? (
              <>
                <span className="text-muted-foreground line-through">{renderValue(oldValues[key])}</span>
                <span className="mx-1.5 text-muted-foreground">←</span>
              </>
            ) : null}
            <span className="font-semibold">{renderValue(newValues?.[key])}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function HistoryTab({ history, now }: { history: AdminUserHistory; now: Date }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Panel>
        <PanelHeader description="فعال‌سازی، تعلیق، مسدودسازی و اخطارها" title="تغییرات وضعیت حساب" />
        {history.moderation.length === 0 ? (
          <EmptyState icon={<ShieldAlert />} title="تا کنون وضعیت این حساب تغییر نکرده است" />
        ) : (
          <ul className="divide-y divide-line">
            {history.moderation.map((row) => {
              const meta = MODERATION_ACTION[row.action];
              return (
                <li className="px-5 py-4" key={row.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={meta?.tone}>{meta?.label ?? row.action}</Badge>
                    <span className="text-[12.5px] font-semibold">{row.adminName}</span>
                    <span className="text-[11.5px] text-muted-foreground" title={formatDateTime(row.createdAt)}>
                      {formatRelative(row.createdAt, now)}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6">{row.reason}</p>
                  {(row.action === "suspend" || row.action === "ban") && row.endsAt ? (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      {new Date(row.endsAt) > now ? "پایان:" : "پایان یافت:"} {formatDateTime(row.endsAt)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel>
        <PanelHeader description="هر تغییری که مدیران روی این حساب داده‌اند" title="گزارش اقدامات مدیران" />
        {history.audits.length === 0 ? (
          <EmptyState icon={<History />} title="هنوز اقدامی ثبت نشده است" />
        ) : (
          <ul className="divide-y divide-line">
            {history.audits.map((log) => (
              <li className="px-5 py-4" key={log.id}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] font-semibold">{log.label}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {log.adminName ?? "مدیر حذف‌شده"}، {formatRelative(log.createdAt, now)}
                  </span>
                  {log.ipAddress ? (
                    <span className="text-[11px] text-muted-foreground">
                      <Ltr>{log.ipAddress}</Ltr>
                    </span>
                  ) : null}
                </div>
                <AuditChanges newValues={log.newValues} oldValues={log.oldValues} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
