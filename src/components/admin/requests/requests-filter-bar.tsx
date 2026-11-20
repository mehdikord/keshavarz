"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

import { PERIOD_OPTIONS, SORT_OPTIONS } from "./request-labels";

export function RequestsFilterBar({
  query,
  serviceOptions,
}: {
  query: { period: string; q?: string; service?: string; sort: string };
  serviceOptions: Array<{ id: string; name: string; services: Array<{ id: string; name: string }> }>;
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

  const hasFilters = Boolean(query.q || query.service || query.period !== "all" || query.sort !== "newest");

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <div className="relative col-span-2 min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی درخواست"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="شناسه درخواست، نام یا موبایل خدمات‌گیرنده/خدمات‌دهنده، نام خدمت یا زمین"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="خدمت"
        className="col-span-2 w-full sm:col-span-1 lg:w-52 [&_select]:h-10"
        onChange={(event) => update({ service: event.target.value || null })}
        value={query.service ?? ""}
      >
        <option value="">همه خدمات</option>
        {serviceOptions.map((category) => (
          <optgroup key={category.id} label={category.name}>
            <option value={`c:${category.id}`}>همه خدمات «{category.name}»</option>
            {category.services.map((service) => (
              <option key={service.id} value={`s:${service.id}`}>
                {service.name}
              </option>
            ))}
          </optgroup>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="بازه زمانی ثبت"
        className="w-full lg:w-36 [&_select]:h-10"
        onChange={(event) => update({ period: event.target.value === "all" ? null : event.target.value })}
        value={query.period}
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="مرتب‌سازی"
        className="w-full lg:w-36 [&_select]:h-10"
        onChange={(event) => update({ sort: event.target.value === "newest" ? null : event.target.value })}
        value={query.sort}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ period: null, q: null, service: null, sort: null });
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
