import { BadgeCheck, SearchX } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatShortDate, formatToman } from "@/lib/admin/format";
import { SUBSCRIPTION_SOURCE, SUBSCRIPTION_STATUS } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";
import type { AdminSubscriptionItem } from "@/server/modules/admin/billing/billing.service";

import { SubscriptionActions } from "./subscription-actions";

export function SubscriptionStatusBadge({ status }: { status: string }) {
  const meta = SUBSCRIPTION_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function DaysLeft({ days }: { days: number | null }) {
  if (days === null) return <span className="text-muted-foreground">—</span>;
  if (days === 0) return <span className="font-semibold text-warn">رو به پایان</span>;
  return (
    <span className={cn("font-semibold tabular-nums", days <= 7 ? "text-warn" : "text-foreground")}>
      {faNumber(days)} روز
    </span>
  );
}

function Period({ item }: { item: AdminSubscriptionItem }) {
  if (!item.startsAt) return <span className="text-muted-foreground">پس از پرداخت</span>;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {formatShortDate(item.startsAt)} ← {formatShortDate(item.endsAt)}
    </span>
  );
}

function Amount({ item }: { item: AdminSubscriptionItem }) {
  if (item.source === "admin_grant") return <span className="text-muted-foreground">رایگان</span>;
  return item.latestPayment ? (
    <Link className="tabular-nums underline-offset-4 hover:underline" href={`/admins/billing/payments/${item.latestPayment.id}`}>
      {formatToman(item.amountToman)}
    </Link>
  ) : (
    <span className="tabular-nums">{formatToman(item.amountToman)}</span>
  );
}

export function SubscriptionsTable({ filtered, items }: { filtered: boolean; items: AdminSubscriptionItem[] }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلترها را تغییر دهید." icon={<SearchX />} title="اشتراکی پیدا نشد" />
    ) : (
      <EmptyState
        description="اشتراک‌ها پس از خرید پلن توسط خدمات‌دهندگان یا اعطای مدیر اینجا دیده می‌شوند."
        icon={<BadgeCheck />}
        title="هنوز اشتراکی ثبت نشده است"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">خدمات‌دهنده</th>
              <th className="px-3 font-semibold" scope="col">پلن</th>
              <th className="px-3 font-semibold" scope="col">دوره</th>
              <th className="px-3 font-semibold" scope="col">مانده</th>
              <th className="px-3 font-semibold" scope="col">مبلغ</th>
              <th className="px-3 font-semibold" scope="col">منبع</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-12 pl-4" scope="col">
                <span className="sr-only">کارها</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-line align-middle last:border-0 hover:bg-raised/70" key={item.id}>
                <td className="py-3 pr-5 pl-3">
                  <Link className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" href={`/admins/providers/${item.provider.id}`}>
                    <Avatar image={item.provider.image} name={item.provider.name} seed={item.provider.id} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-foreground">{item.provider.name}</span>
                      <PhoneText className="text-[11.5px] text-muted-foreground" phone={item.provider.phone} />
                    </span>
                  </Link>
                </td>
                <td className="px-3">
                  <span className="block truncate font-semibold">{item.planName}</span>
                </td>
                <td className="px-3 text-muted-foreground">
                  <Period item={item} />
                </td>
                <td className="px-3">
                  <DaysLeft days={item.daysLeft} />
                </td>
                <td className="px-3">
                  <Amount item={item} />
                </td>
                <td className="px-3">
                  <span className="block">{SUBSCRIPTION_SOURCE[item.source] ?? item.source}</span>
                  {item.grantedBy ? <span className="block text-[11.5px] text-muted-foreground">توسط {item.grantedBy}</span> : null}
                </td>
                <td className="px-3">
                  <SubscriptionStatusBadge status={item.status} />
                  {item.cancellationReason ? (
                    <span className="mt-1 block max-w-44 truncate text-[11px] text-muted-foreground" title={item.cancellationReason}>
                      {item.cancellationReason}
                    </span>
                  ) : null}
                </td>
                <td className="pl-4">
                  <SubscriptionActions
                    subscription={{ endsAt: item.endsAt, id: item.id, planName: item.planName, providerName: item.provider.name, status: item.status }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((item) => (
          <li className="flex items-start gap-3 px-4 py-3" key={item.id}>
            <Avatar image={item.provider.image} name={item.provider.name} seed={item.provider.id} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link className="block truncate font-bold" href={`/admins/providers/${item.provider.id}`}>
                    {item.provider.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{item.planName}</p>
                </div>
                <SubscriptionActions
                  subscription={{ endsAt: item.endsAt, id: item.id, planName: item.planName, providerName: item.provider.name, status: item.status }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                <SubscriptionStatusBadge status={item.status} />
                <Period item={item} />
                {item.daysLeft !== null ? <DaysLeft days={item.daysLeft} /> : null}
                <span>{SUBSCRIPTION_SOURCE[item.source] ?? item.source}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
