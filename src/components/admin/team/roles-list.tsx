"use client";

import { Lock, Plus, Search, SearchX, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Badge } from "@/components/admin/ui/badge";
import { buttonVariants } from "@/components/admin/ui/button";
import { controlClass } from "@/components/admin/ui/input";
import { EmptyState } from "@/components/admin/ui/panel";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { TeamRoleListItem } from "@/server/modules/admin/team/team.service";

import { groupPermissionCodes } from "./team-labels";

export function NewRoleButton() {
  const canManage = useCan(ADMIN_PERMISSIONS.rolesManage);
  if (!canManage) return null;
  return (
    <Link className={buttonVariants()} href="/admins/team/roles/new">
      <Plus />
      نقش جدید
    </Link>
  );
}

export function RolesSearch({ initial }: { initial?: string }) {
  const update = useQueryUpdater();
  const [search, setSearch] = useState(initial ?? "");
  const lastSent = useRef(initial ?? "");
  useEffect(() => {
    const value = search.trim();
    if (value === lastSent.current) return;
    const timer = window.setTimeout(() => {
      lastSent.current = value;
      update({ q: value || null });
    }, 350);
    return () => window.clearTimeout(timer);
  });
  return (
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="جستجوی نقش"
        className={cn(controlClass, "h-10 pr-9")}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="نام یا کد نقش"
        type="search"
        value={search}
      />
    </div>
  );
}

export function RolesList({ filtered, items, totalPermissions }: { filtered: boolean; items: TeamRoleListItem[]; totalPermissions: number }) {
  if (items.length === 0) {
    return filtered ? (
      <EmptyState description="عبارت جستجو یا فیلتر را تغییر دهید." icon={<SearchX />} title="نقشی پیدا نشد" />
    ) : (
      <EmptyState description="با «نقش جدید» مجموعه‌ای از دسترسی‌ها بسازید و به مدیران بدهید." icon={<ShieldCheck />} title="هنوز نقشی ساخته نشده" />
    );
  }
  return (
    <ul className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((role) => {
        const sections = groupPermissionCodes(role.permissions).map((group) => group.label);
        return (
          <li key={role.id}>
            <Link
              className="group flex h-full flex-col rounded-xl border border-line bg-card p-4 transition-colors hover:border-input hover:bg-raised/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              href={`/admins/team/roles/${role.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-bold">
                    {role.isSystem ? <Lock aria-label="نقش سیستمی" className="size-3.5 shrink-0 text-wheat-ink" /> : null}
                    {role.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {role.code}
                  </p>
                </div>
                {role.isActive ? null : <Badge tone="neutral">غیرفعال</Badge>}
              </div>
              {role.description ? <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{role.description}</p> : null}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${Math.round((role.permissions.length / Math.max(1, totalPermissions)) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground">
                {faNumber(role.permissions.length)} دسترسی{sections.length ? `: ${sections.join("، ")}` : ""}
              </p>
              <p className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] font-semibold text-foreground/80">
                <Users className="size-3.5" />
                {role.members ? `${faNumber(role.members)} مدیر` : "بدون عضو"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
