import { ChevronLeft, Receipt, SearchX } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { formatDateTime, formatShortDate, formatToman } from "@/lib/admin/format";
import { PAYMENT_STATUS } from "@/lib/admin/labels";
import type { AdminPaymentItem } from "@/server/modules/admin/billing/billing.service";

import { GATEWAY_LABELS } from "./billing-labels";

export function PaymentStatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PaymentsTable({ filtered, items }: { filtered: boolean; items: AdminPaymentItem[] }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو، بازه یا وضعیت را تغییر دهید." icon={<SearchX />} title="پرداختی پیدا نشد" />
    ) : (
      <EmptyState description="پرداخت‌های خرید اشتراک خدمات‌دهندگان اینجا دیده می‌شوند." icon={<Receipt />} title="هنوز پرداختی ثبت نشده است" />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">پرداخت‌کننده</th>
              <th className="px-3 font-semibold" scope="col">بابت</th>
              <th className="px-3 font-semibold" scope="col">مبلغ</th>
              <th className="px-3 font-semibold" scope="col">تاریخ</th>
              <th className="px-3 font-semibold" scope="col">درگاه</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="group relative border-b border-line last:border-0 hover:bg-raised/70" key={item.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar image={item.user.image} name={item.user.name} seed={item.user.id} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-foreground">{item.user.name}</span>
                      <PhoneText className="text-[11.5px] text-muted-foreground" phone={item.user.phone} />
                    </span>
                  </div>
                </td>
                <td className="px-3">
                  <span className="block truncate">{item.planName ?? "—"}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {item.id.slice(-10)}
                  </span>
                </td>
                <td className="px-3 whitespace-nowrap tabular-nums">
                  <span className="font-semibold">{formatToman(item.amountToman)}</span>
                  {item.refundedToman > 0 ? (
                    <span className="block text-[11.5px] text-warn">−{formatToman(item.refundedToman)} بازپرداخت</span>
                  ) : null}
                </td>
                <td className="px-3 whitespace-nowrap text-muted-foreground" title={formatDateTime(item.paidAt ?? item.initiatedAt)}>
                  {formatShortDate(item.paidAt ?? item.initiatedAt)}
                </td>
                <td className="px-3 text-muted-foreground">{GATEWAY_LABELS[item.gateway] ?? item.gateway}</td>
                <td className="px-3">
                  <PaymentStatusBadge status={item.status} />
                  {item.failureMessage && item.status === "failed" ? (
                    <span className="mt-1 block max-w-48 truncate text-[11px] text-muted-foreground" title={item.failureMessage}>
                      {item.failureMessage}
                    </span>
                  ) : null}
                </td>
                <td className="pl-4">
                  <Link
                    aria-label={`جزئیات پرداخت ${item.user.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground after:absolute after:inset-0 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    href={`/admins/billing/payments/${item.id}`}
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Link className="flex items-start gap-3 px-4 py-3 hover:bg-raised/70" href={`/admins/billing/payments/${item.id}`}>
              <Avatar image={item.user.image} name={item.user.name} seed={item.user.id} size={40} />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate font-bold">{item.user.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatToman(item.amountToman)}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.planName ?? "—"}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  <PaymentStatusBadge status={item.status} />
                  {formatShortDate(item.paidAt ?? item.initiatedAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
