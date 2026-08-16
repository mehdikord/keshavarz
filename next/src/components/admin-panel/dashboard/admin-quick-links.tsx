"use client";

import Link from "next/link";
import {
  ArrowUpLeft,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import type { AdminDashboardKpis } from "@/lib/api/admin-dashboard";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

interface QuickLinkItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  getCount: (data: AdminDashboardKpis) => number;
  danger?: boolean;
}

const LINKS: QuickLinkItem[] = [
  {
    href: "/admins/users",
    title: "کاربران",
    description: "جستجو و moderation کاربران",
    icon: Users,
    getCount: (data) => data.totalUsers,
  },
  {
    href: "/admins/providers",
    title: "خدمات‌دهندگان",
    description: "تأیید و availability",
    icon: BadgeCheck,
    getCount: (data) => data.approvedProviders,
  },
  {
    href: "/admins/service-requests?status=pending_provider",
    title: "درخواست‌های باز",
    description: "صف درخواست‌های در انتظار تأیید",
    icon: ClipboardList,
    getCount: (data) => data.requestsByStatus.pending_provider,
  },
  {
    href: "/admins/payments?status=failed",
    title: "پرداخت‌های ناموفق",
    description: "پیگیری مالی",
    icon: CreditCard,
    getCount: (data) => data.paymentFailuresCount,
    danger: true,
  },
];

interface AdminQuickLinksProps {
  data: AdminDashboardKpis;
}

export function AdminQuickLinks({ data }: AdminQuickLinksProps) {
  return (
    <AdminSectionCard className="h-full">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">دسترسی سریع</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          صف‌های عملیاتی پرترافیک با شمارنده واقعی
        </p>
      </div>

      <div className="grid gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const count = link.getCount(data);
          const danger = Boolean(link.danger && count > 0);

          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)]/60 px-3 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  danger
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {link.title}
                  </span>
                  <span
                    className={cn(
                      "inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      danger
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {toPersianDigits(count)}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {link.description}
                </span>
              </span>
              <ArrowUpLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </AdminSectionCard>
  );
}
