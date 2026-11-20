"use client";

import { CheckCircle2, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { NativeSelect } from "@/components/admin/ui/input";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDateTime, formatRelative } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { AdminDeliveryHealth } from "@/server/modules/admin/notifications/notifications-admin.service";

import { CHANNEL, DELIVERY_STATUS, SKIP_REASON, typeLabel } from "./notification-labels";

const FILTERS = [
  { key: "problem", label: "همه ناموفق‌ها" },
  { key: "dead", label: "متوقف‌شده" },
  { key: "retrying", label: "در حال تلاش مجدد" },
  { key: "queued", label: "در صف" },
  { key: "skipped", label: "ردشده" },
  { key: "delivered", label: "تحویل‌شده" },
  { key: "all", label: "همه" },
] as const;

export function QueueActions({ dead, queued }: { dead: number; queued: number }) {
  const canSend = useCan(ADMIN_PERMISSIONS.notificationsSend);
  const [confirmAll, setConfirmAll] = useState(false);
  const run = useAdminAction();
  const replay = useAdminAction();
  if (!canSend) return null;
  return (
    <>
      <Button
        loading={run.pending}
        onClick={() =>
          void run.run(() => adminApi.post("/notifications/queue/run"), "یک دور پردازش صف انجام شد.")
        }
        variant="outline"
      >
        <Play />
        پردازش صف همین حالا{queued > 0 ? ` (${faNumber(queued)})` : ""}
      </Button>
      {dead > 0 ? (
        <Button onClick={() => setConfirmAll(true)} variant="soft">
          <RotateCcw />
          تلاش دوباره برای همه متوقف‌شده‌ها
        </Button>
      ) : null}
      <ConfirmDialog
        confirm={`بازگرداندن ${faNumber(dead)} مورد به صف`}
        description="تحویل‌هایی که پس از چند بار تلاش متوقف شده‌اند، با شمارنده تلاش صفر دوباره در صف قرار می‌گیرند. اگر علت خطا رفع نشده باشد، دوباره ناموفق می‌شوند."
        onConfirm={() =>
          void replay
            .run(() => adminApi.post("/notifications/deliveries/replay-dead"), "تحویل‌های متوقف‌شده به صف برگشتند.")
            .then((ok) => ok && setConfirmAll(false))
        }
        onOpenChange={setConfirmAll}
        open={confirmAll}
        pending={replay.pending}
        title="تلاش دوباره برای همه"
        tone="primary"
      />
    </>
  );
}

export function QueueSummary({ health }: { health: AdminDeliveryHealth }) {
  const { summary } = health;
  const tiles = [
    {
      hint: summary.oldestQueuedAt ? `قدیمی‌ترین: ${formatRelative(summary.oldestQueuedAt)}` : "صف خالی است",
      label: "در صف",
      value: summary.queued,
    },
    { hint: `پس از ${faNumber(health.maxAttempts)} تلاش`, label: "متوقف‌شده", tone: summary.dead > 0 ? "text-danger" : undefined, value: summary.dead },
    { hint: "با فاصله زمانی دوباره تلاش می‌شوند", label: "در حال تلاش مجدد", tone: summary.retrying > 0 ? "text-warn" : undefined, value: summary.retrying },
    { hint: "کانالی که پیکربندی نشده", label: "ردشده", value: summary.skipped },
    { hint: "از ابتدا", label: "تحویل‌شده", tone: "text-ok", value: summary.delivered },
  ];
  const channels = Object.entries(health.byChannel);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--a-shadow-raise)]" key={tile.label}>
            <p className="text-[11.5px] font-medium text-muted-foreground">{tile.label}</p>
            <p className={cn("mt-1 text-[18px] font-extrabold tabular-nums", tile.tone)}>{faNumber(tile.value)}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{tile.hint}</p>
          </div>
        ))}
      </div>
      {channels.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--a-shadow-raise)]">
          <table className="w-full min-w-[520px] text-[12.5px]">
            <caption className="px-5 pt-3 text-right text-[13px] font-bold">وضعیت به تفکیک کانال</caption>
            <thead>
              <tr className="border-b border-line text-right text-[11.5px] text-muted-foreground">
                <th className="py-2.5 pr-5 font-semibold" scope="col">کانال</th>
                {["queued", "delivered", "failed", "skipped"].map((status) => (
                  <th className="px-3 font-semibold" key={status} scope="col">
                    {DELIVERY_STATUS[status]?.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map(([channel, counts]) => (
                <tr className="border-b border-line last:border-0" key={channel}>
                  <th className="py-2.5 pr-5 text-right font-semibold" scope="row">
                    {CHANNEL[channel] ?? channel}
                  </th>
                  {["queued", "delivered", "failed", "skipped"].map((status) => (
                    <td className="px-3 tabular-nums" key={status}>
                      {faNumber((counts[status] ?? 0) + (status === "delivered" ? (counts.sent ?? 0) : 0))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function DeliveryFilters({ channel, status }: { channel: string; status: string }) {
  const update = useQueryUpdater();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hrefFor = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (key === "problem") params.delete("status");
    else params.set("status", key);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="admin-scroll -mx-1 flex flex-1 gap-1 overflow-x-auto px-1 pb-1">
        {FILTERS.map((filter) => (
          <Link
            aria-current={filter.key === status ? "page" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-lg px-2.5 text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter.key === status ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={hrefFor(filter.key)}
            key={filter.key}
            scroll={false}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <NativeSelect
        aria-label="کانال"
        className="w-36 [&_select]:h-9"
        onChange={(event) => update({ channel: event.target.value === "all" ? null : event.target.value })}
        value={channel}
      >
        <option value="all">همه کانال‌ها</option>
        <option value="in_app">درون‌برنامه</option>
        <option value="sms">پیامک</option>
        <option value="push">پوش</option>
      </NativeSelect>
    </div>
  );
}

export function DeliveriesTable({ items, now }: { items: AdminDeliveryHealth["deliveries"]["items"]; now: Date }) {
  const canSend = useCan(ADMIN_PERMISSIONS.notificationsSend);
  const replay = useAdminAction();
  const [replaying, setReplaying] = useState<string | null>(null);

  if (items.length === 0) {
    return <EmptyState description="در این دسته موردی وجود ندارد." icon={<CheckCircle2 />} title="صف سالم است" />;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const meta = DELIVERY_STATUS[item.status] ?? { label: item.status, tone: "neutral" as const };
        return (
          <li className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3 sm:px-5" key={item.id}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold">{item.notification.title}</span>
                <Badge dot={false} tone="neutral">
                  {typeLabel(item.notification.type)}
                </Badge>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                {item.notification.user ? (
                  <>
                    <Link className="font-semibold text-foreground/80 hover:underline" href={`/admins/users/${item.notification.user.id}`}>
                      {item.notification.user.name}
                    </Link>
                    <PhoneText phone={item.notification.user.phone} />
                    <span aria-hidden>·</span>
                  </>
                ) : null}
                <span title={formatDateTime(item.queuedAt)}>ورود به صف {formatRelative(item.queuedAt, now)}</span>
              </p>
              {item.error ? (
                <p className="mt-1.5 rounded-lg bg-raised px-2.5 py-1.5 font-mono text-[11.5px] break-all text-foreground/80" dir="ltr">
                  {SKIP_REASON[item.error] ?? item.error}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={item.isDead ? "danger" : meta.tone}>
                {CHANNEL[item.channel] ?? item.channel}: {item.isDead ? "متوقف‌شده" : meta.label}
              </Badge>
              <span className="text-[11.5px] text-muted-foreground tabular-nums">{faNumber(item.attempts)} تلاش</span>
              {canSend && item.status === "failed" ? (
                <Button
                  loading={replay.pending && replaying === item.id}
                  onClick={() => {
                    setReplaying(item.id);
                    void replay.run(
                      () => adminApi.post(`/notifications/deliveries/${item.id}/replay`),
                      "تحویل دوباره در صف قرار گرفت.",
                    );
                  }}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw />
                  تلاش دوباره
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
