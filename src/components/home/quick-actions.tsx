"use client";

import Link from "next/link";
import { ClipboardList, LandPlot, Search, Tractor } from "lucide-react";

import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    href: "/users/search",
    label: "جستجوی خدمات",
    icon: Search,
    tone: "bg-[#fdefd6] text-[#b4661a]",
  },
  {
    href: "/users/lands",
    label: "زمین‌های من",
    icon: LandPlot,
    tone: "bg-[#fdefd6] text-[#b4661a]",
  },
  {
    href: "/providers/services",
    label: "خدمات من",
    icon: Tractor,
    tone: "bg-[#d8f3dc] text-[#2d6a4f]",
  },
  {
    href: "/providers/requests",
    label: "درخواست‌ها",
    icon: ClipboardList,
    tone: "bg-[#d8f3dc] text-[#2d6a4f]",
  },
];

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title" className="px-4">
      <h2 id="quick-actions-title" className="mb-3 px-1 text-[15px] font-black text-foreground">
        دسترسی سریع
      </h2>
      <div className="grid grid-cols-4 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-[22px] bg-surface px-1 py-3.5 shadow-[0_6px_18px_-10px_rgba(45,106,79,0.35)] ring-1 ring-border/60 transition-all duration-200 active:scale-95 hover:-translate-y-0.5 hover:ring-primary/25"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                  action.tone,
                )}
              >
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
              <span className="text-center text-[11px] font-bold leading-4 text-foreground/85">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
