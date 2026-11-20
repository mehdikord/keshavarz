"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQueryUpdater } from "@/components/admin/users/users-list-controls";
import { controlClass } from "@/components/admin/ui/input";
import { cn } from "@/lib/utils";

/** Debounced `?q=` search box for the billing lists. */
export function BillingSearchInput({ initial, label, placeholder }: { initial?: string; label: string; placeholder: string }) {
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
    <div className="relative col-span-2 min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label={label}
        className={cn(controlClass, "h-10 pr-9")}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={search}
      />
    </div>
  );
}
