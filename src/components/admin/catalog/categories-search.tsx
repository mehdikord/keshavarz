"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { controlClass } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

export function CategoriesSearch({ initial }: { initial?: string }) {
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
        aria-label="جستجوی دسته‌بندی"
        className={cn(controlClass, "h-10 pr-9")}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="نام یا شناسه لاتین دسته"
        type="search"
        value={search}
      />
    </div>
  );
}
