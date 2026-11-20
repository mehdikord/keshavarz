"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

export function ProvidersFilterBar({
  provinces,
  query,
  services,
}: {
  provinces: Array<{ id: string; name: string }>;
  query: { province?: number; q?: string; service?: string; sort: string };
  services: Array<{ category: string; id: string; name: string }>;
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

  const byCategory = new Map<string, typeof services>();
  for (const service of services) {
    byCategory.set(service.category, [...(byCategory.get(service.category) ?? []), service]);
  }
  const hasFilters = Boolean(query.q || query.province || query.service || query.sort !== "newest");

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <div className="relative col-span-2 min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی خدمات‌دهنده"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام، شماره موبایل یا شناسه"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="خدمت ارائه‌شده"
        className="w-full lg:w-48 [&_select]:h-10"
        onChange={(event) => update({ service: event.target.value || null })}
        value={query.service ?? ""}
      >
        <option value="">همه خدمات</option>
        {[...byCategory.entries()].map(([category, items]) => (
          <optgroup key={category} label={category}>
            {items.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </optgroup>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="استان"
        className="w-full lg:w-40 [&_select]:h-10"
        onChange={(event) => update({ province: event.target.value || null })}
        value={query.province ? String(query.province) : ""}
      >
        <option value="">همه استان‌ها</option>
        {provinces.map((province) => (
          <option key={province.id} value={province.id}>
            {province.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="مرتب‌سازی"
        className="col-span-2 w-full sm:col-span-1 lg:w-44 [&_select]:h-10"
        onChange={(event) => update({ sort: event.target.value === "newest" ? null : event.target.value })}
        value={query.sort}
      >
        <option value="newest">جدیدترین</option>
        <option value="oldest">قدیمی‌ترین</option>
        <option value="name">نام (الفبایی)</option>
        <option value="services">بیشترین خدمت</option>
      </NativeSelect>
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ province: null, q: null, service: null, sort: null });
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
