import { Inbox, ListTree, Megaphone } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admins/notifications", icon: Megaphone, key: "campaigns", label: "ارسال‌های مدیر" },
  { href: "/admins/notifications/all", icon: Inbox, key: "all", label: "همه اعلان‌ها" },
  { href: "/admins/notifications/queue", icon: ListTree, key: "queue", label: "صف تحویل" },
] as const;

export function NotificationSectionTabs({
  current,
  problems = 0,
}: {
  current: (typeof TABS)[number]["key"];
  /** Dead-letter count, flagged on the queue tab. */
  problems?: number;
}) {
  return (
    <nav aria-label="بخش‌های اعلان" className="admin-scroll -mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {TABS.map((tab) => {
        const active = tab.key === current;
        const Icon = tab.icon;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-soil text-soil-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
            href={tab.href}
            key={tab.key}
          >
            <Icon className="size-4" />
            {tab.label}
            {tab.key === "queue" && problems > 0 ? (
              <span className="min-w-5 rounded-full bg-danger px-1.5 text-center text-[11px] leading-5 text-white">
                {new Intl.NumberFormat("fa-IR").format(problems)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
