"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

export interface DockItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  featured?: boolean;
}

interface DockNavProps {
  items: DockItem[];
  className?: string;
  variant?: "provider" | "consumer";
  homeHref?: string;
}

export function DockNav({
  items,
  className,
  variant = "provider",
  homeHref = "/providers/home",
}: DockNavProps) {
  const pathname = usePathname();
  const isConsumer = variant === "consumer";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t px-2 pt-2 pb-safe",
        isConsumer
          ? "border-accent/20 bg-gradient-to-t from-[#fff8f2]/95 to-[#fffdfb]/92 backdrop-blur-xl shadow-[0_-4px_20px_rgba(244,162,97,0.12)]"
          : "glass-dock border-white/60",
        className,
      )}
      aria-label="ناوبری اصلی"
    >
      <div className="grid grid-cols-5 items-end gap-1 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== homeHref && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-end gap-1 rounded-2xl px-1 py-2 transition-all duration-200",
                item.featured && "-mt-3",
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-2xl transition-all duration-200",
                  item.featured
                    ? cn(
                        "size-12 text-white shadow-md group-active:scale-95",
                        isConsumer
                          ? "bg-gradient-to-br from-accent to-[#e76f51]"
                          : "bg-gradient-to-br from-primary to-success",
                      )
                    : "size-9",
                  !item.featured &&
                    (isActive
                      ? cn(
                          "scale-105",
                          isConsumer
                            ? "bg-accent/15 text-accent"
                            : "bg-primary/12 text-primary",
                        )
                      : "text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"),
                )}
              >
                <Icon
                  className={cn(item.featured ? "size-5" : "size-[18px]")}
                  strokeWidth={isActive || item.featured ? 2 : 1.75}
                />
                {item.badge && item.badge > 0 ? (
                  <Badge className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-white">
                    {toPersianDigits(item.badge > 9 ? "9+" : item.badge)}
                  </Badge>
                ) : null}
              </div>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-medium transition-colors",
                  isActive
                    ? isConsumer
                      ? "text-accent"
                      : "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
