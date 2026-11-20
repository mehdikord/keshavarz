"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/admin/ui/badge";
import { controlClass } from "@/components/admin/ui/input";
import { Tooltip } from "@/components/admin/ui/tooltip";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { RoleOption } from "@/server/modules/admin/team/team.service";

/**
 * Multi-select list of roles with search (the dev DB has dozens of test roles).
 * Roles granting something the editor lacks are locked unless already held.
 */
export function RolePicker({
  canGrant,
  initiallySelected,
  onChange,
  roles,
  value,
}: {
  canGrant: (role: RoleOption) => boolean;
  initiallySelected: string[];
  onChange: (next: string[]) => void;
  roles: RoleOption[];
  value: string[];
}) {
  const [query, setQuery] = useState("");
  const selected = new Set(value);
  // Sorted by what was held when the picker opened, so rows don't jump while ticking.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle ? roles.filter((role) => `${role.name} ${role.code}`.toLowerCase().includes(needle)) : roles;
    return [...list].sort(
      (a, b) =>
        Number(initiallySelected.includes(b.id)) - Number(initiallySelected.includes(a.id)) ||
        Number(b.isActive) - Number(a.isActive),
    );
  }, [initiallySelected, query, roles]);

  return (
    <div className="rounded-xl border border-line">
      <div className="relative border-b border-line p-2">
        <Search className="pointer-events-none absolute top-1/2 right-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی نقش"
          className={cn(controlClass, "pr-8")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`جستجو بین ${faNumber(roles.length)} نقش`}
          type="search"
          value={query}
        />
      </div>
      <ul className="admin-scroll grid max-h-64 gap-0.5 overflow-y-auto p-1.5">
        {visible.length === 0 ? <li className="px-3 py-4 text-center text-[12.5px] text-muted-foreground">نقشی پیدا نشد</li> : null}
        {visible.map((role) => {
          const checked = selected.has(role.id);
          const locked = !checked && !initiallySelected.includes(role.id) && !canGrant(role);
          const row = (
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted/60",
                locked && "cursor-not-allowed opacity-55 hover:bg-transparent",
              )}
            >
              <input
                checked={checked}
                className="size-4 shrink-0 accent-[var(--a-soil)]"
                disabled={locked}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(role.id);
                  else next.delete(role.id);
                  onChange([...next]);
                }}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{role.name}</span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                  {role.code}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{faNumber(role.permissions.length)} دسترسی</span>
              {role.isActive ? null : <Badge tone="neutral">غیرفعال</Badge>}
            </label>
          );
          return (
            <li key={role.id}>
              {locked ? (
                <Tooltip content="این نقش دسترسی‌هایی دارد که خودتان ندارید.">
                  <div>{row}</div>
                </Tooltip>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
