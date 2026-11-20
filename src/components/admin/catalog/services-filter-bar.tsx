"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

import type { CategoryOption } from "./service-form-dialog";

export function ServicesFilterBar({
  categories,
  query,
}: {
  categories: CategoryOption[];
  query: { category?: string; q?: string; sort: string };
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

  const hasFilters = Boolean(query.q || query.category || query.sort !== "order");

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
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ category: null, q: null, sort: null });
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
