import Link from "next/link";
import { BadgeCheck, CalendarClock, Check, ClipboardList, CreditCard, ExternalLink, MapPin, X } from "lucide-react";

import { CatalogThumb } from "@/components/admin/catalog/catalog-thumb";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { PhoneText } from "@/components/admin/ui/ltr";
import { DescriptionList, EmptyState, Panel, PanelHeader } from "@/components/admin/ui/panel";
import { faNumber, formatDate, formatDateTime, formatRelative, formatToman } from "@/lib/admin/format";
import { REQUEST_STATUS, SUBSCRIPTION_SOURCE, SUBSCRIPTION_STATUS } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type { AdminProviderDetail } from "@/server/modules/admin/providers/providers-admin.service";

import { ELIGIBILITY_GAP, ELIGIBILITY_ORDER, LINK_STATUS } from "./labels";
import { BioEditor, ProviderHeaderActions } from "./provider-actions";
import { EligibilityBadge } from "./providers-table";

export const PROVIDER_DETAIL_TABS = ["overview", "services", "area", "subscriptions", "requests", "gallery"] as const;
export type ProviderDetailTab = (typeof PROVIDER_DETAIL_TABS)[number];

/** Where an admin fixes each eligibility gap. */
const GAP_TAB: Partial<Record<string, ProviderDetailTab>> = {
  services: "services",
  subscription: "subscriptions",
  workArea: "area",
};

const tabHref = (id: string, tab: ProviderDetailTab) =>
  tab === "overview" ? `/admins/providers/${id}` : `/admins/providers/${id}?tab=${tab}`;

export function subscriptionsHref(phone: string) {
  return `/admins/billing/subscriptions?q=${encodeURIComponent(phone)}`;
}

export function ProviderHeader({ detail, now }: { detail: AdminProviderDetail; now: Date }) {
  const { stats } = detail;
  const decided = stats.accepted + stats.rejected;
  const items = [
    { label: "درخواست دریافتی", sub: `${faNumber(stats.waiting)} در انتظار پاسخ`, value: faNumber(stats.invitations) },
    {
      label: "نرخ پذیرش",
      sub: `${faNumber(stats.accepted)} پذیرفته، ${faNumber(stats.rejected)} رد`,
      value: decided ? `${faNumber(Math.round((stats.accepted / decided) * 100))}٪` : "—",
    },
    { label: "کار انجام‌شده", sub: `${faNumber(stats.inProgressJobs)} کار در جریان`, value: faNumber(stats.completedJobs) },
    { label: "درآمد از کارها", sub: "جمع مبلغ توافقی", value: formatToman(stats.revenueToman) },
    {
      label: "اشتراک",
      sub: detail.subscription ? `تا ${formatDate(detail.subscription.endsAt)}` : "اشتراک فعالی ندارد",
      value: detail.subscription?.planName ?? "—",
    },
  ];

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
        <Avatar className="ring-4 ring-canvas" image={detail.image} name={detail.name} seed={detail.id} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">{detail.name}</h1>
            <EligibilityBadge missing={detail.eligibility.missing} />
            {detail.approvedAt ? (
              <Badge dot={false} tone="info">
                <BadgeCheck className="size-3.5" />
                تأییدشده
              </Badge>
            ) : (
              <Badge dot={false} tone="wheat">
                در انتظار تأیید
              </Badge>
            )}
            {detail.accountDeleted ? <Badge tone="danger">حساب کاربری حذف شده</Badge> : null}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <PhoneText className="font-semibold text-foreground" phone={detail.phone} />
              <CopyButton label="کپی شماره" value={detail.phone} />
            </span>
            {detail.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {detail.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              خدمات‌دهنده از {formatDate(detail.createdAt)}
            </span>
            <span>
              {detail.lastLoginAt ? (
                <span title={formatDateTime(detail.lastLoginAt)}>آخرین ورود {formatRelative(detail.lastLoginAt, now)}</span>
              ) : (
                "هنوز وارد نشده"
              )}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ProviderHeaderActions
            approved={detail.approvedAt !== null}
            id={detail.id}
            isActive={detail.isActive}
            isAvailable={detail.isAvailable}
          />
        </div>
      </div>
      {!detail.isActive ? (
        <div className="border-t border-line bg-muted px-5 py-3 text-[13px] font-semibold text-foreground/80 sm:px-6">
          پروفایل خدمات‌دهندگی غیرفعال است؛ این کاربر در جستجوی کشاورزان دیده نمی‌شود و درخواست جدید دریافت نمی‌کند.
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div className="min-w-0 bg-raised px-5 py-4 last:col-span-2 sm:px-6 lg:last:col-span-1" key={item.label}>
            <dt className="text-[11.5px] font-medium text-muted-foreground">{item.label}</dt>
            <dd className="mt-1.5 truncate text-[15px] leading-tight font-extrabold sm:text-lg">{item.value}</dd>
            <dd className="mt-1 truncate text-[11.5px] text-muted-foreground">{item.sub}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function ProviderTabsNav({ active, detail }: { active: ProviderDetailTab; detail: AdminProviderDetail }) {
  const tabs: Array<{ count?: number; key: ProviderDetailTab; label: string; warn?: boolean }> = [
    { key: "overview", label: "نمای کلی" },
    {
      count: detail.services.filter((service) => service.isActive).length,
      key: "services",
      label: "خدمات و قیمت‌ها",
      warn: detail.eligibility.missing.includes("services"),
    },
    { key: "area", label: "محدوده و موقعیت", warn: detail.eligibility.missing.includes("workArea") },
    { key: "subscriptions", label: "اشتراک‌ها", warn: detail.eligibility.missing.includes("subscription") },
    { count: detail.stats.invitations, key: "requests", label: "درخواست‌ها" },
    { count: detail.gallery.length, key: "gallery", label: "نمونه‌کارها" },
  ];
  return (
    <nav aria-label="بخش‌های پرونده خدمات‌دهنده" className="admin-scroll -mx-1 overflow-x-auto px-1">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                href={tabHref(detail.id, tab.key)}
                scroll={false}
              >
                {tab.label}
                {tab.warn ? <span aria-label="ناقص" className="size-1.5 rounded-full bg-warn" /> : null}
                {tab.count ? (
                  <span className="rounded-full bg-muted px-1.5 text-[11px] leading-5 text-muted-foreground">{faNumber(tab.count)}</span>
                ) : null}
                {isActive ? <span aria-hidden className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-wheat" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ProviderOverview({ detail, now }: { detail: AdminProviderDetail; now: Date }) {
  const missing = new Set<string>(detail.eligibility.missing);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="grid content-start gap-5 lg:col-span-2">
        <Panel>
          <PanelHeader title="معرفی" />
          <div className="px-5 pb-5">
            <BioEditor bio={detail.bio} id={detail.id} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="مشخصات" />
          <div className="px-5 pb-5">
            <DescriptionList
              items={[
                {
                  label: "تأیید",
                  value: detail.approvedAt
                    ? `${formatDate(detail.approvedAt)}${detail.approvedBy ? ` به دست ${detail.approvedBy}` : ""}`
                    : "هنوز تأیید نشده",
                },
                { label: "پذیرش کار", value: detail.isAvailable ? "آماده پذیرش کار" : "فعلاً کار نمی‌پذیرد" },
                {
                  label: "محدوده کاری",
                  value: detail.workArea.latitude ? (
                    <Link className="text-info hover:underline" href={tabHref(detail.id, "area")} scroll={false}>
                      شعاع {faNumber(detail.workArea.radiusKm)} کیلومتر
                    </Link>
                  ) : (
                    "مشخص نشده"
                  ),
                },
                {
                  label: "اشتراک فعلی",
                  value: detail.subscription
                    ? `${detail.subscription.planName}، تا ${formatDate(detail.subscription.endsAt)}`
                    : "ندارد",
                },
              ]}
            />
          </div>
        </Panel>
        <RecentRequests detail={detail} limit={5} now={now} />
      </div>

      <Panel className="content-start self-start overflow-hidden">
        <PanelHeader
          description={
            detail.eligibility.searchable
              ? "همه شرایط برقرار است؛ کشاورزان این خدمات‌دهنده را در جستجو می‌بینند."
              : "تا همه موارد زیر برقرار نشود، در جستجوی کشاورزان دیده نمی‌شود."
          }
          title="شرایط نمایش در جستجو"
        />
        <ul className="grid gap-px border-t border-line bg-line">
          {ELIGIBILITY_ORDER.map((gap) => {
            const ok = !missing.has(gap);
            const fixTab = GAP_TAB[gap];
            return (
              <li className="flex items-start gap-3 bg-card px-5 py-3" key={gap}>
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    ok ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn",
                  )}
                >
                  {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{ELIGIBILITY_GAP[gap]?.label}</p>
                  {!ok ? <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">{ELIGIBILITY_GAP[gap]?.hint}</p> : null}
                </div>
                {!ok && fixTab ? (
                  <Link className="shrink-0 text-[12px] font-semibold text-info hover:underline" href={tabHref(detail.id, fixTab)} scroll={false}>
                    رفع
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

export function RecentRequests({ detail, limit, now }: { detail: AdminProviderDetail; limit?: number; now: Date }) {
  const rows = limit ? detail.recentRequests.slice(0, limit) : detail.recentRequests;
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        action={
          limit && detail.recentRequests.length > limit ? (
            <Link className="text-[12px] font-semibold text-info hover:underline" href={tabHref(detail.id, "requests")} scroll={false}>
              همه
            </Link>
          ) : null
        }
        description="آخرین درخواست‌هایی که برای این خدمات‌دهنده ارسال شده است"
        title="درخواست‌ها"
      />
      {rows.length === 0 ? (
        <EmptyState className="border-t border-line" icon={<ClipboardList />} title="هنوز درخواستی دریافت نکرده است" />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {rows.map((row) => {
            const link = LINK_STATUS[row.linkStatus];
            const status = REQUEST_STATUS[row.requestStatus];
            return (
              <li className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 hover:bg-raised/70" key={row.requestId}>
                <CatalogThumb image={row.serviceImage} name={row.serviceName} size={38} />
                <div className="min-w-0 flex-1">
                  <Link
                    className="block truncate font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
                    href={`/admins/requests/${row.requestId}`}
                  >
                    {row.serviceName}
                  </Link>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {row.consumerName} · {row.landTitle} · {faNumber(row.distanceKm)} کیلومتر
                  </p>
                </div>
                <span className="text-[12.5px] font-semibold tabular-nums">{formatToman(row.priceToman)}</span>
                <div className="flex items-center gap-1.5">
                  {link ? <Badge tone={link.tone}>{link.label}</Badge> : null}
                  {status ? (
                    <Badge dot={false} tone={status.tone}>
                      {status.label}
                    </Badge>
                  ) : null}
                </div>
                <span className="w-20 text-left text-[11.5px] text-muted-foreground" title={formatDateTime(row.sentAt)}>
                  {formatRelative(row.sentAt, now)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function ProviderSubscriptions({ detail, grant }: { detail: AdminProviderDetail; grant?: React.ReactNode }) {
  return (
    <div className="grid gap-5">
      <Panel>
        <PanelHeader
          action={
            <>
              <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={subscriptionsHref(detail.phone)}>
                <CreditCard />
                اشتراک‌ها در بخش مالی
                <ExternalLink className="size-3.5" />
              </Link>
              {grant}
            </>
          }
          description={
            detail.subscription
              ? `پلن «${detail.subscription.planName}» از ${formatDate(detail.subscription.startsAt)} تا ${formatDate(detail.subscription.endsAt)} (${SUBSCRIPTION_SOURCE[detail.subscription.source] ?? detail.subscription.source})`
              : "اشتراک فعالی ندارد؛ بدون اشتراک در جستجوی کشاورزان دیده نمی‌شود."
          }
          title="اشتراک فعلی"
        />
      </Panel>
      <Panel className="overflow-hidden">
        <PanelHeader title={`سابقه اشتراک (${faNumber(detail.subscriptions.length)})`} />
        {detail.subscriptions.length === 0 ? (
          <EmptyState className="border-t border-line" icon={<CreditCard />} title="هنوز اشتراکی نداشته است" />
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-right text-[11.5px] text-muted-foreground">
                  <th className="py-3 pr-5 pl-3 font-semibold" scope="col">پلن</th>
                  <th className="px-3 font-semibold" scope="col">بازه</th>
                  <th className="px-3 font-semibold" scope="col">مبلغ</th>
                  <th className="px-3 font-semibold" scope="col">منبع</th>
                  <th className="px-3 pl-5 font-semibold" scope="col">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {detail.subscriptions.map((row) => {
                  const status = SUBSCRIPTION_STATUS[row.status];
                  return (
                    <tr className="border-b border-line last:border-0" key={row.id}>
                      <td className="py-3 pr-5 pl-3 font-semibold">{row.planName}</td>
                      <td className="px-3 text-muted-foreground">
                        {formatDate(row.startsAt)} تا {formatDate(row.endsAt)}
                      </td>
                      <td className="px-3 tabular-nums">{row.amountToman ? formatToman(row.amountToman) : "رایگان"}</td>
                      <td className="px-3">
                        {SUBSCRIPTION_SOURCE[row.source] ?? row.source}
                        {row.grantedBy ? <span className="block text-[11.5px] text-muted-foreground">{row.grantedBy}</span> : null}
                      </td>
                      <td className="px-3 pl-5">
                        {status ? <Badge tone={status.tone}>{status.label}</Badge> : row.status}
                        {row.cancellationReason ? (
                          <span className="mt-1 block max-w-48 truncate text-[11.5px] text-muted-foreground" title={row.cancellationReason}>
                            {row.cancellationReason}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
