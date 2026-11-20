import Link from "next/link";
import { Ban, CalendarClock, Fingerprint, PauseCircle, PowerOff, Trash2 } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Ltr, PhoneText } from "@/components/admin/ui/ltr";
import { Panel } from "@/components/admin/ui/panel";
import { faNumber, formatArea, formatDate, formatDateTime, formatRelative, formatToman } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { UserDetailTab } from "@/server/modules/admin/users/users.schemas";
import type { AdminUserHeader } from "@/server/modules/admin/users/users.service";

import { SendNotificationLink } from "./send-notification-link";
import { LiftRestrictionButton, UserHeaderActions } from "./user-actions";
import { RoleBadges, UserStatusBadge } from "./users-table";

export function UserProfileHeader({
  header,
  now,
  provinces,
}: {
  header: AdminUserHeader;
  now: Date;
  provinces: Array<{ id: string; name: string }>;
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
        <Avatar className="ring-4 ring-canvas" image={header.image} name={header.name} seed={header.id} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">{header.name}</h1>
            <UserStatusBadge restrictionEndsAt={header.restrictionEndsAt} status={header.status} />
            <RoleBadges isProvider={header.provider !== null} providerApproved={Boolean(header.provider?.approvedAt)} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <PhoneText className="font-semibold text-foreground" phone={header.phone} />
              <CopyButton label="کپی شماره" value={header.phone} />
            </span>
            <span className="inline-flex items-center gap-1">
              <Fingerprint className="size-3.5" />
              <Ltr className="text-[12px]">{header.id}</Ltr>
              <CopyButton label="کپی شناسه" value={header.id} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              عضو از {formatDate(header.createdAt)}
            </span>
            <span>
              {header.lastLoginAt ? (
                <span title={formatDateTime(header.lastLoginAt)}>آخرین ورود {formatRelative(header.lastLoginAt, now)}</span>
              ) : (
                "هنوز وارد نشده"
              )}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {header.status === "deleted" ? null : <SendNotificationLink userId={header.id} />}
          <UserHeaderActions
            activeSessions={header.counters.activeSessions}
            provinces={provinces}
            status={header.status}
            user={{
              cityId: header.city?.id ?? null,
              id: header.id,
              name: header.name,
              phone: header.phone,
              provinceId: header.province?.id ?? null,
            }}
          />
        </div>
      </div>
      <RestrictionBanner header={header} />
      <UserStatsStrip header={header} />
    </Panel>
  );
}

function RestrictionBanner({ header }: { header: AdminUserHeader }) {
  if (header.status === "active") return null;

  const variants = {
    banned: {
      action: <LiftRestrictionButton userId={header.id} />,
      className: "bg-danger-soft text-danger",
      icon: Ban,
      text: "این حساب به‌طور دائم مسدود است و کاربر نمی‌تواند وارد شود.",
    },
    deleted: {
      action: null,
      className: "bg-muted text-muted-foreground",
      icon: Trash2,
      text: `این حساب در ${formatDateTime(header.deletedAt)} حذف شده است. سوابق کاربر برای مراجعه حفظ شده‌اند.`,
    },
    inactive: {
      action: null,
      className: "bg-muted text-foreground/80",
      icon: PowerOff,
      text: "این حساب غیرفعال است و کاربر تا فعال‌سازی دوباره نمی‌تواند وارد شود.",
    },
    suspended: {
      action: <LiftRestrictionButton userId={header.id} />,
      className: "bg-warn-soft text-warn",
      icon: PauseCircle,
      text: `این حساب تا ${formatDateTime(header.restrictionEndsAt)} تعلیق است.`,
    },
  } as const;
  const variant = variants[header.status as keyof typeof variants];
  if (!variant) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 sm:px-6", variant.className)}>
      <variant.icon className="size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-[13px] leading-6">
        <span className="font-semibold">{variant.text}</span>
        {header.restriction && (header.status === "banned" || header.status === "suspended") ? (
          <span className="block text-[12px] opacity-85">
            دلیل: {header.restriction.reason} (به دست {header.restriction.adminName}، {formatDate(header.restriction.startsAt)})
          </span>
        ) : null}
      </div>
      {variant.action}
    </div>
  );
}

function UserStatsStrip({ header }: { header: AdminUserHeader }) {
  const { counters } = header;
  const stats = [
    {
      label: "زمین",
      sub: counters.landsCount ? formatArea(counters.landArea) : "زمینی ثبت نشده",
      value: faNumber(counters.landsCount),
    },
    {
      label: "درخواست خدمت",
      sub: `${faNumber(counters.requests.completed)} انجام‌شده، ${faNumber(
        counters.requests.awaiting_send + counters.requests.pending_provider + counters.requests.in_progress,
      )} باز`,
      value: faNumber(counters.requests.total),
    },
    {
      label: "هزینه خدمات انجام‌شده",
      sub: "جمع مبلغ توافقی",
      value: formatToman(counters.spentTotal),
    },
    {
      label: "پرداخت اشتراک",
      sub: header.provider ? "مجموع پرداخت‌های موفق" : "خدمات‌دهنده نیست",
      value: formatToman(counters.paidTotal),
    },
    {
      label: "نشست فعال",
      sub: counters.unreadNotifications ? `${faNumber(counters.unreadNotifications)} اعلان خوانده‌نشده` : "همه اعلان‌ها خوانده شده",
      value: faNumber(counters.activeSessions),
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          className="min-w-0 bg-raised px-5 py-4 last:col-span-2 sm:px-6 lg:last:col-span-1"
          key={stat.label}
        >
          <dt className="text-[11.5px] font-medium text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1.5 text-[15px] leading-tight font-extrabold sm:text-lg">{stat.value}</dd>
          <dd className="mt-1 truncate text-[11.5px] text-muted-foreground">{stat.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

export function UserTabsNav({
  active,
  header,
}: {
  active: UserDetailTab;
  header: AdminUserHeader;
}) {
  const tabs: Array<{ count?: number; key: UserDetailTab; label: string }> = [
    { key: "overview", label: "نمای کلی" },
    { count: header.counters.landsCount, key: "lands", label: "زمین‌ها" },
    { count: header.counters.requests.total, key: "requests", label: "درخواست‌ها" },
    ...(header.provider ? [{ key: "provider" as const, label: "خدمات‌دهندگی" }] : []),
    { key: "payments", label: "پرداخت‌ها" },
    { count: header.counters.activeSessions, key: "sessions", label: "نشست‌ها و ورود" },
    { key: "notifications", label: "اعلان‌ها" },
    { key: "history", label: "تاریخچه مدیریتی" },
  ];
  return (
    <nav aria-label="بخش‌های پرونده کاربر" className="admin-scroll -mx-1 overflow-x-auto px-1">
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
                href={tab.key === "overview" ? `/admins/users/${header.id}` : `/admins/users/${header.id}?tab=${tab.key}`}
                scroll={false}
              >
                {tab.label}
                {tab.count ? (
                  <span className="rounded-full bg-muted px-1.5 text-[11px] leading-5 text-muted-foreground">
                    {faNumber(tab.count)}
                  </span>
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
