import { ChevronLeft, ClipboardList, SearchX } from "lucide-react";
import Link from "next/link";

import { CatalogThumb } from "@/components/admin/catalog/catalog-thumb";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatArea, formatDayMonth, formatDateTime, formatRelative, formatToman } from "@/lib/admin/format";
import { REQUEST_STATUS } from "@/lib/admin/labels";
import type { AdminRequestListItem } from "@/server/modules/admin/requests/requests-admin.service";

export function RequestStatusBadge({ status }: { status: string }) {
  const meta = REQUEST_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function datesText(dates: string[]) {
  if (dates.length === 0) return "—";
  const first = formatDayMonth(dates[0]);
  return dates.length > 1 ? `${first} (+${faNumber(dates.length - 1)} روز)` : first;
}

function ProviderCell({ request }: { request: AdminRequestListItem }) {
  if (request.provider) return <span className="font-medium">{request.provider.name}</span>;
  if (request.status === "cancelled" || request.status === "awaiting_send") {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="text-[12px] text-muted-foreground">
      {request.providersInvited > 0 ? `${faNumber(request.providersInvited)} دعوت ارسال شده` : "هنوز ارسال نشده"}
    </span>
  );
}

export function RequestsTable({ filtered, items, now }: { filtered: boolean; items: AdminRequestListItem[]; now: Date }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلترها را تغییر دهید." icon={<SearchX />} title="درخواستی با این مشخصات پیدا نشد" />
    ) : (
      <EmptyState
        description="درخواست‌ها پس از اولین جستجوی خدمات‌گیرندگان در این فهرست دیده می‌شوند."
        icon={<ClipboardList />}
        title="هنوز درخواستی ثبت نشده است"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">خدمت</th>
              <th className="px-3 font-semibold" scope="col">خدمات‌گیرنده</th>
              <th className="px-3 font-semibold" scope="col">زمین</th>
              <th className="px-3 font-semibold" scope="col">زمان انجام</th>
              <th className="px-3 font-semibold" scope="col">خدمات‌دهنده</th>
              <th className="px-3 font-semibold" scope="col">مبلغ توافقی</th>
              <th className="px-3 font-semibold" scope="col">ثبت</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((request) => (
              <tr className="group relative border-b border-line last:border-0 hover:bg-raised/70" key={request.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CatalogThumb image={request.serviceImage} name={request.serviceName} size={40} />
                    <div className="min-w-0">
                      {/* The stretched link makes the whole row open the request. */}
                      <Link
                        className="block truncate font-bold text-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                        href={`/admins/requests/${request.id}`}
                      >
                        {request.serviceName}
                      </Link>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{request.category}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3">
                  <span className="block truncate font-medium">{request.consumer.name}</span>
                  <PhoneText className="text-[11.5px] text-muted-foreground" phone={request.consumer.phone} />
                </td>
                <td className="px-3">
                  <span className="block max-w-40 truncate">{request.landTitle}</span>
                  <span className="text-[11.5px] text-muted-foreground">{formatArea(request.landAreaSquareMeters)}</span>
                </td>
                <td className="px-3 whitespace-nowrap">{datesText(request.dates)}</td>
                <td className="px-3">
                  <ProviderCell request={request} />
                </td>
                <td className="px-3 whitespace-nowrap tabular-nums">
                  {request.agreedPriceToman ? formatToman(request.agreedPriceToman) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 whitespace-nowrap text-muted-foreground" title={formatDateTime(request.createdAt)}>
                  {formatRelative(request.createdAt, now)}
                </td>
                <td className="px-3">
                  <RequestStatusBadge status={request.status} />
                </td>
                <td className="pl-4 text-muted-foreground">
                  <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {items.map((request) => (
          <li className="relative flex items-start gap-3 px-4 py-3" key={request.id}>
            <CatalogThumb image={request.serviceImage} name={request.serviceName} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link
                  className="min-w-0 truncate font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                  href={`/admins/requests/${request.id}`}
                >
                  {request.serviceName}
                </Link>
                <RequestStatusBadge status={request.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {request.consumer.name} · {request.landTitle}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                <span>{datesText(request.dates)}</span>
                {request.provider ? <span>{request.provider.name}</span> : null}
                {request.agreedPriceToman ? <span className="tabular-nums">{formatToman(request.agreedPriceToman)}</span> : null}
                <span>{formatRelative(request.createdAt, now)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
