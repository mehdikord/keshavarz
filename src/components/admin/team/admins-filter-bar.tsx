"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

export function AdminsFilterBar({
  query,
  roles,
}: {
  query: { q?: string; role?: string };
  roles: Array<{ id: string; isActive: boolean; name: string }>;
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

  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:flex sm:flex-wrap">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی مدیر"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام، شماره موبایل، ایمیل یا شناسه"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="نقش"
        className="w-full sm:w-56 [&_select]:h-10"
        onChange={(event) => update({ role: event.target.value || null })}
        value={query.role ?? ""}
      >
        <option value="">همه نقش‌ها</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
            {role.isActive ? "" : " (غیرفعال)"}
          </option>
        ))}
      </NativeSelect>
      {query.q || query.role ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ q: null, role: null });
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
