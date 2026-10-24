"use client";

import { useMemo, useState } from "react";
import { Check, Search, Sprout, X } from "lucide-react";

import type { AppCategory, AppService } from "@/lib/api/app-catalog";
import { cn } from "@/lib/utils";

export type CatalogTree = Array<AppCategory & { services: AppService[] }>;

interface ServicePickerProps {
  catalog: CatalogTree;
  value: string;
  onChange: (serviceId: string, categoryId: string) => void;
}

/** One search box across every service; category chips only narrow the list. */
export function ServicePicker({ catalog, value, onChange }: ServicePickerProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const results = useMemo(() => {
    const term = query.trim();
    return catalog
      .filter((category) => term || !categoryId || category.categoryId === categoryId)
      .flatMap((category) =>
        category.services
          .filter((service) =>
            term ? service.name.includes(term) || (service.description ?? "").includes(term) : true,
          )
          .map((service) => ({ ...service, categoryId: category.categoryId, categoryName: category.name })),
      );
  }, [catalog, categoryId, query]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#a08463]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثلاً شخم، سم‌پاشی یا برداشت"
          aria-label="جستجوی خدمت"
          className="h-12 w-full rounded-2xl bg-[#fcf7ee] pl-10 pr-10 [&::-webkit-search-cancel-button]:appearance-none text-[13px] text-[#3b2410] outline-none ring-1 ring-[#efe0c8] transition placeholder:text-[#b8a189] focus:bg-white focus:ring-2 focus:ring-[#e3b97f]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="پاک کردن جستجو"
            className="absolute left-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f1e6d6] text-[#8a6a48]"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {!query.trim() ? (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {[{ categoryId: null, name: "همه" }, ...catalog].map((category) => {
            const active = categoryId === category.categoryId;
            return (
              <button
                key={category.categoryId ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryId(category.categoryId)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-[12px] font-bold transition-colors",
                  active ? "bg-[#3b2410] text-[#fff3dc]" : "bg-white text-[#6b4a26] ring-1 ring-[#efe0c8] hover:bg-[#fff8ec]",
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul role="radiogroup" aria-label="خدمات" className="mt-3 max-h-72 space-y-1.5 overflow-y-auto overscroll-contain">
        {results.length === 0 ? (
          <li className="rounded-2xl bg-[#fcf7ee] px-4 py-6 text-center text-[12px] text-[#8a6a48]">
            خدمتی با «{query}» پیدا نشد
          </li>
        ) : (
          results.map((service) => {
            const selected = service.serviceId === value;
            return (
              <li key={service.serviceId}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(service.serviceId, service.categoryId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors",
                    selected ? "bg-[#fff1df] ring-2 ring-[#b9531f]" : "hover:bg-[#fcf7ee]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      selected ? "bg-[#b9531f] text-white" : "bg-[#e9f3e2] text-[#3f7d45]",
                    )}
                  >
                    {selected ? <Check className="size-4" strokeWidth={3} /> : <Sprout className="size-[18px]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-[#3b2410]">{service.name}</span>
                    <span className="block truncate text-[11px] text-[#8a6a48]">
                      {service.description || service.categoryName}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
