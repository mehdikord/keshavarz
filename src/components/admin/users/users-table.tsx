import Link from "next/link";
import { ChevronLeft, SearchX, Users } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { faNumber, formatDate, formatDateTime, formatRelative, formatShortDate } from "@/lib/admin/format";
import { USER_STATUS } from "@/lib/admin/labels";
import type { AdminUserListItem } from "@/server/modules/admin/users/users.service";

export function UserStatusBadge({
  restrictionEndsAt,
  status,
}: {
  restrictionEndsAt?: string | null;
  status: string;
}) {
  const meta = USER_STATUS[status] ?? { label: status, tone: "neutral" as const };
  const badge = <Badge tone={meta.tone}>{meta.label}</Badge>;
  if (status === "suspended" && restrictionEndsAt) {
    return (
      <Tooltip content={`تا ${formatDateTime(restrictionEndsAt)}`}>
        <span tabIndex={0}>{badge}</span>
      </Tooltip>
    );
  }
  return badge;
}

export function RoleBadges({ isProvider, providerApproved }: { isProvider: boolean; providerApproved: boolean }) {
  if (!isProvider) return <span className="text-[12.5px] text-muted-foreground">خدمات‌گیرنده</span>;
  return (
    <Badge dot={false} tone={providerApproved ? "info" : "wheat"}>
      {providerApproved ? "خدمات‌دهنده" : "خدمات‌دهنده (تأییدنشده)"}
    </Badge>
  );
}

export function UsersTable({
  filtered,
  items,
  now,
}: {
  filtered: boolean;
  items: AdminUserListItem[];
  now: Date;
}) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState
        description="عبارت جستجو یا فیلترها را تغییر دهید."
        icon={<SearchX />}
        title="کاربری با این مشخصات پیدا نشد"
      />
    ) : (
      <EmptyState
        description="کاربران پس از اولین ورود با کد تأیید در این فهرست دیده می‌شوند."
        icon={<Users />}
        title="هنوز کاربری ثبت‌نام نکرده است"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">کاربر</th>
              <th className="px-3 font-semibold" scope="col">نقش</th>
              <th className="px-3 font-semibold" scope="col">موقعیت</th>
              <th className="px-3 font-semibold" scope="col">فعالیت</th>
              <th className="px-3 font-semibold" scope="col">آخرین ورود</th>
              <th className="px-3 font-semibold" scope="col">عضویت</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr
                className="group relative border-b border-line transition-colors last:border-0 hover:bg-raised"
                key={user.id}
              >
                <td className="py-3 pr-5 pl-3">
                  <div className="flex items-center gap-3">
                    <Avatar image={user.image} name={user.name} seed={user.id} size={38} />
                    <div className="min-w-0">
                      <Link
                        className="block truncate font-bold text-foreground outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                        href={`/admins/users/${user.id}`}
                      >
                        {user.name}
                      </Link>
                      <span className="text-[12px] text-muted-foreground">
                        <PhoneText phone={user.phone} />
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3">
                  <RoleBadges isProvider={user.isProvider} providerApproved={user.providerApproved} />
                </td>
                <td className="px-3 text-muted-foreground">
                  {user.province ? (
                    <span className="text-foreground">
                      {user.province}
                      {user.city ? <span className="text-muted-foreground">، {user.city}</span> : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 text-[12.5px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{faNumber(user.landsCount)}</span> زمین،{" "}
                  <span className="font-semibold text-foreground">{faNumber(user.requestsCount)}</span> درخواست
                </td>
                <td className="px-3 text-[12.5px]">
                  {user.lastLoginAt ? (
                    <span title={formatDateTime(user.lastLoginAt)}>{formatRelative(user.lastLoginAt, now)}</span>
                  ) : (
                    <span className="text-muted-foreground">هرگز</span>
                  )}
                </td>
                <td className="px-3 text-[12.5px] text-muted-foreground" title={formatDate(user.createdAt)}>
                  {formatShortDate(user.createdAt)}
                </td>
                <td className="px-3">
                  <UserStatusBadge restrictionEndsAt={user.restrictionEndsAt} status={user.status} />
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
        {items.map((user) => (
          <li key={user.id}>
            <Link
              className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-raised focus-visible:bg-raised focus-visible:outline-none"
              href={`/admins/users/${user.id}`}
            >
              <Avatar image={user.image} name={user.name} seed={user.id} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-bold">{user.name}</span>
                  <UserStatusBadge restrictionEndsAt={user.restrictionEndsAt} status={user.status} />
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  <PhoneText phone={user.phone} />
                  {user.province ? `، ${user.province}` : ""}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  <RoleBadges isProvider={user.isProvider} providerApproved={user.providerApproved} />
                  <span>
                    {faNumber(user.landsCount)} زمین، {faNumber(user.requestsCount)} درخواست
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
