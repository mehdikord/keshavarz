"use client";

import { Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import type { CategoryOption } from "./service-form-dialog";

export function ServicesFilterBar({
  categories,
  query,
  specialCount,
}: {
  categories: CategoryOption[];
  query: { category?: string; q?: string; sort: string; special: boolean };
  /** Featured services in the whole catalog. */
  specialCount: number;
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

  const hasFilters = Boolean(query.q || query.category || query.special || query.sort !== "order");

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <div className="relative col-span-2 min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی خدمت"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام، شناسه لاتین یا توضیحات خدمت"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="دسته‌بندی"
        className="w-full lg:w-48 [&_select]:h-10"
        onChange={(event) => update({ category: event.target.value || null })}
        value={query.category ?? ""}
      >
        <option value="">همه دسته‌ها</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
            {category.isActive ? "" : " (غیرفعال)"}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="مرتب‌سازی"
        className="w-full lg:w-44 [&_select]:h-10"
        onChange={(event) => update({ sort: event.target.value === "order" ? null : event.target.value })}
        value={query.sort}
      >
        <option value="order">ترتیب نمایش</option>
        <option value="name">نام (الفبایی)</option>
        <option value="newest">جدیدترین</option>
        <option value="popular">پرتقاضاترین</option>
      </NativeSelect>
      <button
        aria-pressed={query.special}
        className={cn(
          "col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-span-1",
          query.special
            ? "border-wheat/50 bg-wheat-soft text-wheat-ink"
            : "border-input bg-background text-foreground/80 hover:bg-raised",
        )}
        onClick={() => update({ special: query.special ? null : "1" })}
        type="button"
      >
        <Sparkles className="size-4" />
        فقط خدمات ویژه
        <span className="rounded-full bg-foreground/[0.06] px-1.5 text-[11px] tabular-nums">{faNumber(specialCount)}</span>
      </button>
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ category: null, q: null, sort: null, special: null });
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
