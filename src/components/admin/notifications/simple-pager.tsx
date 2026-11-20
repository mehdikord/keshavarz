"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/** Previous/next pager for lists with a fixed page size. */
export function SimplePager({ page, pageCount, param = "page", total }: { page: number; pageCount: number; param?: string; total: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pageCount <= 1) return null;
  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) params.delete(param);
    else params.set(param, String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const link = "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[12.5px] text-muted-foreground">
      <span>
        صفحه {faNumber(page)} از {faNumber(pageCount)} · {faNumber(total)} مورد
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link className={cn(link, "text-foreground hover:bg-muted")} href={hrefFor(page - 1)} scroll={false}>
            <ChevronRight className="size-4" />
            قبلی
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link className={cn(link, "text-foreground hover:bg-muted")} href={hrefFor(page + 1)} scroll={false}>
            بعدی
            <ChevronLeft className="size-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
