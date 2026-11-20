"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/admin/ui/button";
import { controlClass, NativeSelect } from "@/components/admin/ui/input";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const PendingContext = createContext<{ navigate: (href: string) => void; pending: boolean }>({
  navigate: () => {},
  pending: false,
});

/** Keeps URL-driven filters and the server-rendered table in one transition. */
export function UsersListFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.replace(href, { scroll: false }));
  return <PendingContext.Provider value={{ navigate, pending }}>{children}</PendingContext.Provider>;
}

export function PendingArea({ children }: { children: React.ReactNode }) {
  const { pending } = useContext(PendingContext);
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-55")}>
      {children}
    </div>
  );
}

export function useQueryUpdater() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate } = useContext(PendingContext);
  return (updates: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };
}

const STATUS_TABS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
  { key: "suspended", label: "تعلیق" },
  { key: "banned", label: "مسدود" },
  { key: "deleted", label: "حذف‌شده" },
] as const;

export function StatusTabs({
  counts,
  current,
  label = "وضعیت حساب",
  tabs = STATUS_TABS,
}: {
  counts: Record<string, number>;
  current: string;
  label?: string;
  tabs?: ReadonlyArray<{ key: string; label: string }>;
}) {
  const update = useQueryUpdater();
  return (
    <div aria-label={label} className="admin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <button
            aria-selected={active}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
            key={tab.key}
            onClick={() => update({ status: tab.key === "all" ? null : tab.key })}
            role="tab"
            type="button"
          >
            {tab.label}
            <span
              className={cn(
                "min-w-6 rounded-full px-1.5 text-center text-[11px] leading-5",
                active ? "bg-white/15" : "bg-muted text-muted-foreground",
              )}
            >
              {faNumber(counts[tab.key] ?? 0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function UsersFilterBar({
  provinces,
  query,
}: {
  provinces: Array<{ id: string; name: string }>;
  query: { province?: number; q?: string; role: string; sort: string };
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

  const hasFilters = Boolean(query.q || query.province || query.role !== "all" || query.sort !== "newest");

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <div className="relative col-span-2 min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label="جستجوی کاربر"
          className={cn(controlClass, "h-10 pr-9")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام، شماره موبایل یا شناسه کاربر"
          type="search"
          value={search}
        />
      </div>
      <NativeSelect
        aria-label="نقش"
        className="w-full lg:w-40 [&_select]:h-10"
        onChange={(event) => update({ role: event.target.value === "all" ? null : event.target.value })}
        value={query.role}
      >
        <option value="all">همه نقش‌ها</option>
        <option value="consumer">فقط خدمات‌گیرنده</option>
        <option value="provider">خدمات‌دهنده</option>
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
        <option value="newest">جدیدترین عضویت</option>
        <option value="oldest">قدیمی‌ترین عضویت</option>
        <option value="recent_login">آخرین ورود</option>
        <option value="name">نام (الفبایی)</option>
      </NativeSelect>
      {hasFilters ? (
        <Button
          onClick={() => {
            setSearch("");
            lastSent.current = "";
            update({ province: null, q: null, role: null, sort: null });
          }}
          size="md"
          variant="ghost"
        >
          <X />
          پاک کردن فیلترها
        </Button>
      ) : null}
    </div>
  );
}

function pageWindow(page: number, pageCount: number): Array<number | "gap"> {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  const output: Array<number | "gap"> = [];
  for (const value of sorted) {
    const previous = output.at(-1);
    if (typeof previous === "number" && value - previous > 1) output.push("gap");
    output.push(value);
  }
  return output;
}

export function Pagination({
  page,
  pageCount,
  perPage,
  total,
}: {
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
}) {
  const update = useQueryUpdater();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[12.5px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>
          نمایش {faNumber(from)} تا {faNumber(to)} از {faNumber(total)}
        </span>
        <NativeSelect
          aria-label="تعداد در هر صفحه"
          className="w-24 [&_select]:h-8 [&_select]:text-xs"
          onChange={(event) => update({ perPage: event.target.value === "20" ? null : event.target.value })}
          value={String(perPage)}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {faNumber(size)} ردیف
            </option>
          ))}
        </NativeSelect>
      </div>
      {pageCount > 1 ? (
        <nav aria-label="صفحه‌بندی" className="flex items-center gap-1">
          {pageWindow(page, pageCount).map((entry, index) =>
            entry === "gap" ? (
              <span className="px-1" key={`gap-${index}`}>
                …
              </span>
            ) : (
              <Link
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  entry === page ? "bg-soil text-soil-foreground" : "text-foreground hover:bg-muted",
                )}
                href={hrefFor(entry)}
                key={entry}
                scroll={false}
              >
                {faNumber(entry)}
              </Link>
            ),
          )}
        </nav>
      ) : null}
    </div>
  );
}
