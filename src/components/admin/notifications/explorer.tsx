"use client";

import { ChevronDown, Inbox, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime, formatRelative } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { AdminNotificationItem } from "@/server/modules/admin/notifications/notifications-admin.service";

import { CHANNEL, DELIVERY_STATUS, deepLinkLabel, PERIOD_OPTIONS, SKIP_REASON, typeLabel } from "./notification-labels";

export function ExplorerFilterBar({
  query,
  types,
}: {
  query: { period: string; q?: string; read: string; recipient: string; type?: string };
  types: Array<{ count: number; type: string }>;
}) {
  const update = useQueryUpdater();
  const [search, setSearch] = useState(query.q ?? "");
  const lastSent = useRef(query.q ?? "");

  useEffect(() => {
    const value = search.trim();
    if (value === lastSent.current) return;
    const timer = window.setTimeout(() => {
      lastSent.current = value;
      update({ q: value || null });
    }, 350);
    return () => window.clearTimeout(timer);
  });

  const hasFilters = Boolean(query.q || query.type || query.period !== "all" || query.read !== "all" || query.recipient !== "all");

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <div className="relative col-span-2 min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی اعلان"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="عنوان، نام یا موبایل گیرنده، شناسه اعلان یا درخواست"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="نوع اعلان"
        className="w-full lg:w-44 [&_select]:h-10"
        onChange={(event) => update({ type: event.target.value || null })}
        value={query.type ?? ""}
      >
        <option value="">همه انواع</option>
        {types.map((entry) => (
          <option key={entry.type} value={entry.type}>
            {typeLabel(entry.type)} ({faNumber(entry.count)})
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="وضعیت خواندن"
        className="w-full lg:w-36 [&_select]:h-10"
        onChange={(event) => update({ read: event.target.value === "all" ? null : event.target.value })}
        value={query.read}
      >
        <option value="all">خوانده و نخوانده</option>
        <option value="unread">نخوانده</option>
        <option value="read">خوانده‌شده</option>
      </NativeSelect>
      <NativeSelect
        aria-label="گیرنده"
        className="w-full lg:w-32 [&_select]:h-10"
        onChange={(event) => update({ recipient: event.target.value === "all" ? null : event.target.value })}
        value={query.recipient}
      >
        <option value="all">همه گیرندگان</option>
        <option value="user">کاربران</option>
        <option value="admin">مدیران</option>
      </NativeSelect>
      <NativeSelect
        aria-label="بازه زمانی"
        className="w-full lg:w-36 [&_select]:h-10"
        onChange={(event) => update({ period: event.target.value === "all" ? null : event.target.value })}
        value={query.period}
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ period: null, q: null, read: null, recipient: null, type: null });
          }}
          variant="ghost"
        >
          <X />
          پاک کردن فیلترها
        </Button>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, now }: { item: AdminNotificationItem; now: Date }) {
  const [open, setOpen] = useState(false);
  const link = deepLinkLabel(item.deepLink);
  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        {item.recipient.kind === "user" ? (
          <Avatar image={item.recipient.image} name={item.recipient.name} seed={item.recipient.id ?? item.id} size={34} />
        ) : (
          <Avatar name={item.recipient.name} seed="admin" size={34} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] font-bold">{item.title}</span>
            <Badge dot={false} tone={item.type === "admin_broadcast" ? "wheat" : "neutral"}>
              {typeLabel(item.type)}
            </Badge>
            {item.readAt ? null : <Badge tone="info">نخوانده</Badge>}
          </div>
          <p className={cn("mt-0.5 text-[12.5px] leading-6 text-foreground/80", open ? "whitespace-pre-line" : "line-clamp-1")}>
            {item.body}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
            {item.recipient.kind === "user" && item.recipient.id ? (
              <Link className="font-semibold text-foreground/80 hover:underline" href={`/admins/users/${item.recipient.id}`}>
                {item.recipient.name}
              </Link>
            ) : (
              <span className="font-semibold">{item.recipient.name} (مدیر)</span>
            )}
            {item.recipient.phone ? <PhoneText phone={item.recipient.phone} /> : null}
            <span aria-hidden>·</span>
            <span title={formatDateTime(item.createdAt)}>{formatRelative(item.createdAt, now)}</span>
          </p>
        </div>
        <Button
          aria-expanded={open}
          aria-label={open ? "بستن جزئیات" : "نمایش جزئیات"}
          onClick={() => setOpen(!open)}
          size="icon-sm"
          variant="ghost"
        >
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      </div>
      {open ? (
        <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-xl bg-raised p-3 text-[12px] sm:mr-[46px] sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">زمان ثبت</dt>
            <dd className="font-medium">{formatDateTime(item.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">خوانده‌شدن</dt>
            <dd className="font-medium">{item.readAt ? formatDateTime(item.readAt) : "هنوز خوانده نشده"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">تحویل</dt>
            <dd className="mt-0.5 flex flex-wrap gap-1">
              {item.deliveries.length === 0 ? "—" : null}
              {item.deliveries.map((delivery) => {
                const meta = DELIVERY_STATUS[delivery.status] ?? { label: delivery.status, tone: "neutral" as const };
                return (
                  <Badge key={delivery.id} tone={meta.tone}>
                    {CHANNEL[delivery.channel] ?? delivery.channel}: {meta.label}
                    {delivery.attempts > 1 ? ` (${faNumber(delivery.attempts)} تلاش)` : ""}
                  </Badge>
                );
              })}
            </dd>
            {item.deliveries
              .filter((delivery) => delivery.error)
              .map((delivery) => (
                <p className="mt-1 text-[11.5px] text-muted-foreground" key={delivery.id}>
                  {SKIP_REASON[delivery.error!] ?? delivery.error}
                </p>
              ))}
          </div>
          <div>
            <dt className="text-muted-foreground">مرتبط با</dt>
            <dd className="font-medium">
              {item.requestId ? (
                <Link className="underline-offset-4 hover:underline" href={`/admins/requests/${item.requestId}`}>
                  درخواست {item.requestId.slice(-6)}
                </Link>
              ) : item.campaignId ? (
                <Link className="underline-offset-4 hover:underline" href={`/admins/notifications/campaigns/${item.campaignId}`}>
                  ارسال گروهی مدیر
                </Link>
              ) : (
                "—"
              )}
              {link ? <span className="text-muted-foreground"> · مقصد: {link}</span> : null}
            </dd>
          </div>
        </dl>
      ) : null}
    </li>
  );
}

export function NotificationsList({ filtered, items, now }: { filtered: boolean; items: AdminNotificationItem[]; now: Date }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلترها را تغییر دهید." icon={<SearchX />} title="اعلانی با این مشخصات پیدا نشد" />
    ) : (
      <EmptyState description="اعلان‌های سامانه و پیام‌های مدیر اینجا دیده می‌شوند." icon={<Inbox />} title="هنوز اعلانی ثبت نشده است" />
    );
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <NotificationRow item={item} key={item.id} now={now} />
      ))}
    </ul>
  );
}
