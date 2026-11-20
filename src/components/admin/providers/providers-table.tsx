import Link from "next/link";
import { BadgeCheck, ChevronLeft, MapPin, MapPinOff, SearchX, Tractor } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { faNumber, formatDate } from "@/lib/admin/format";
import type { AdminProviderListItem } from "@/server/modules/admin/providers/providers-admin.service";

import { ELIGIBILITY_GAP } from "./labels";

/** Searchable, or the first thing keeping the provider out of search. */
export function EligibilityBadge({ missing }: { missing: string[] }) {
  if (missing.length === 0) return <Badge tone="success">در جستجو دیده می‌شود</Badge>;
  const reasons = missing.map((gap) => ELIGIBILITY_GAP[gap]?.label ?? gap);
  return (
    <Tooltip content={`کمبود: ${reasons.join("، ")}`}>
      <span tabIndex={0}>
        <Badge tone={missing.includes("active") ? "neutral" : "warning"}>
          {missing.includes("active") ? "غیرفعال" : `${faNumber(missing.length)} مورد ناقص`}
        </Badge>
      </span>
    </Tooltip>
  );
}

function SubscriptionCell({ subscription }: { subscription: AdminProviderListItem["subscription"] }) {
  if (!subscription) return <span className="text-[12.5px] text-muted-foreground">ندارد</span>;
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold">{subscription.planName}</p>
      <p className="text-[11.5px] text-muted-foreground">تا {formatDate(subscription.endsAt)}</p>
    </div>
  );
}

function AreaCell({ item }: { item: AdminProviderListItem }) {
  return item.hasWorkArea ? (
    <span className="inline-flex items-center gap-1.5">
      <MapPin className="size-3.5 text-ok" />
      شعاع {faNumber(item.workRadiusKm)} کیلومتر
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-warn">
      <MapPinOff className="size-3.5" />
      ثبت نشده
    </span>
  );
}

export function ProvidersTable({ filtered, items }: { filtered: boolean; items: AdminProviderListItem[] }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو، فیلترها یا زبانه را تغییر دهید." icon={<SearchX />} title="خدمات‌دهنده‌ای پیدا نشد" />
    ) : (
      <EmptyState
        description="کاربرانی که در اپلیکیشن پروفایل خدمات‌دهندگی بسازند اینجا دیده می‌شوند."
        icon={<Tractor />}
        title="خدمات‌دهنده‌ای در این دسته نیست"
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
              <th className="px-3 font-semibold" scope="col">خدمات فعال</th>
              <th className="px-3 font-semibold" scope="col">محدوده کاری</th>
              <th className="px-3 font-semibold" scope="col">اشتراک</th>
              <th className="px-3 font-semibold" scope="col">کار انجام‌شده</th>
              <th className="px-3 font-semibold" scope="col">وضعیت جستجو</th>
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
                    <Avatar image={item.image} name={item.name} seed={item.id} size={38} />
                    <div className="min-w-0">
                      <Link
                        className="flex items-center gap-1.5 truncate font-bold text-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        href={`/admins/providers/${item.id}`}
                      >
                        {item.name}
                        {item.approved ? <BadgeCheck aria-label="تأییدشده" className="size-4 shrink-0 text-info" /> : null}
                      </Link>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        <PhoneText phone={item.phone} />
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 tabular-nums">{faNumber(item.servicesCount)}</td>
                <td className="px-3">
                  <AreaCell item={item} />
                </td>
                <td className="px-3">
                  <SubscriptionCell subscription={item.subscription} />
                </td>
                <td className="px-3 tabular-nums">{faNumber(item.completedJobs)}</td>
                <td className="relative z-10 px-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <EligibilityBadge missing={item.missing} />
                    {item.isActive && !item.isAvailable ? <Badge tone="neutral">کار نمی‌پذیرد</Badge> : null}
                  </div>
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
        {items.map((item) => (
          <li className="relative px-4 py-3" key={item.id}>
            <div className="flex items-start gap-3">
              <Avatar image={item.image} name={item.name} seed={item.id} size={42} />
              <div className="min-w-0 flex-1">
                <Link
                  className="flex items-center gap-1.5 font-bold outline-none after:absolute after:inset-0"
                  href={`/admins/providers/${item.id}`}
                >
                  <span className="truncate">{item.name}</span>
                  {item.approved ? <BadgeCheck aria-label="تأییدشده" className="size-4 shrink-0 text-info" /> : null}
                </Link>
                <p className="text-[11.5px] text-muted-foreground">
                  <PhoneText phone={item.phone} />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground">
                  <EligibilityBadge missing={item.missing} />
                  <span>{faNumber(item.servicesCount)} خدمت</span>
                  <AreaCell item={item} />
                  <span>{item.subscription ? `اشتراک تا ${formatDate(item.subscription.endsAt)}` : "بدون اشتراک"}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
