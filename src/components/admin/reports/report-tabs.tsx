import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ReportTab } from "@/server/modules/admin/reports/reports-admin.schemas";

export const REPORT_TAB_LABELS: Record<ReportTab, string> = {
  growth: "رشد کاربران",
  marketplace: "درخواست‌ها و بازار",
  providers: "خدمات‌دهندگان",
  revenue: "درآمد و اشتراک",
};

export function ReportTabs({ current, query }: { current: ReportTab; query: URLSearchParams }) {
  return (
    <nav aria-label="بخش‌های گزارش" className="admin-scroll -mx-1 overflow-x-auto px-1">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {(Object.keys(REPORT_TAB_LABELS) as ReportTab[]).map((tab) => {
          const params = new URLSearchParams(query);
          if (tab === "growth") params.delete("tab");
          else params.set("tab", tab);
          const active = tab === current;
          return (
            <li key={tab}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 items-center px-3.5 text-[13.5px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                href={`?${params.toString()}`}
                scroll={false}
              >
                {REPORT_TAB_LABELS[tab]}
                {active ? <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-wheat" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
