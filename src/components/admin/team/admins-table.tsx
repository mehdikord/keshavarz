import Link from "next/link";
import { ChevronLeft, Crown, Lock, SearchX, UserCog } from "lucide-react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Badge } from "@/components/admin/ui/badge";
import { PhoneText } from "@/components/admin/ui/ltr";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber, formatDateTime, formatRelative } from "@/lib/admin/format";
import type { TeamAdminListItem } from "@/server/modules/admin/team/team.service";

export function AdminStatusBadge({ admin }: { admin: Pick<TeamAdminListItem, "isActive" | "lockedUntil"> }) {
  if (!admin.isActive) return <Badge tone="neutral">غیرفعال</Badge>;
  if (admin.lockedUntil) {
    return (
      <Badge tone="warning">
        <Lock className="size-3" />
        قفل تا {formatDateTime(admin.lockedUntil)}
      </Badge>
    );
  }
  return <Badge tone="success">فعال</Badge>;
}

export function RoleChips({ admin }: { admin: Pick<TeamAdminListItem, "isSuperAdmin" | "roles"> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {admin.isSuperAdmin ? (
        <Badge dot={false} tone="wheat">
          <Crown className="size-3" />
          مدیر ارشد
        </Badge>
      ) : null}
      {admin.roles.map((role) => (
        <Badge dot={false} key={role.id} tone={role.isActive ? "info" : "neutral"}>
          {role.name}
          {role.expiresAt ? " ⏳" : ""}
        </Badge>
      ))}
      {!admin.isSuperAdmin && admin.roles.length === 0 ? (
        <span className="text-[12px] text-muted-foreground">بدون نقش</span>
      ) : null}
    </div>
  );
}

export function AdminsTable({ filtered, items, now }: { filtered: boolean; items: TeamAdminListItem[]; now: Date }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلترها را تغییر دهید." icon={<SearchX />} title="مدیری پیدا نشد" />
    ) : (
      <EmptyState icon={<UserCog />} title="هنوز مدیری تعریف نشده است" />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-right text-[11.5px] font-semibold text-muted-foreground">
              <th className="py-3 pr-5 pl-3 font-semibold" scope="col">مدیر</th>
              <th className="px-3 font-semibold" scope="col">نقش‌ها</th>
              <th className="px-3 font-semibold" scope="col">آخرین ورود</th>
              <th className="px-3 font-semibold" scope="col">نشست فعال</th>
              <th className="px-3 font-semibold" scope="col">وضعیت</th>
              <th className="w-10 pl-4" scope="col">
                <span className="sr-only">جزئیات</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((admin) => (
              <tr className="group relative border-b border-line last:border-0 hover:bg-raised/70" key={admin.id}>
                <td className="py-3 pr-5 pl-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar image={admin.image} name={admin.name} seed={admin.id} size={36} />
                    <div className="min-w-0">
                      <Link
                        className="block truncate font-bold text-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        href={`/admins/team/admins/${admin.id}`}
                      >
                        {admin.name}
                      </Link>
                      <PhoneText className="text-[12px] text-muted-foreground" phone={admin.phone} />
                    </div>
                  </div>
                </td>
                <td className="max-w-72 px-3">
                  <RoleChips admin={admin} />
                  {admin.overrides > 0 ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {faNumber(admin.overrides)} استثنای دسترسی
                    </span>
                  ) : null}
                </td>
                <td className="px-3 text-[12.5px]" title={admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : undefined}>
                  {admin.lastLoginAt ? formatRelative(admin.lastLoginAt, now) : <span className="text-muted-foreground">هرگز</span>}
                </td>
                <td className="px-3 tabular-nums">{faNumber(admin.activeSessions)}</td>
                <td className="px-3">
                  <AdminStatusBadge admin={admin} />
                </td>
                <td className="pl-4 text-muted-foreground">
                  <ChevronLeft className="size-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {items.map((admin) => (
          <li className="relative flex items-start gap-3 px-4 py-3" key={admin.id}>
            <Avatar image={admin.image} name={admin.name} seed={admin.id} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link className="truncate font-bold after:absolute after:inset-0" href={`/admins/team/admins/${admin.id}`}>
                  {admin.name}
                </Link>
                <AdminStatusBadge admin={admin} />
              </div>
              <PhoneText className="text-[12px] text-muted-foreground" phone={admin.phone} />
              <div className="mt-2">
                <RoleChips admin={admin} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
