import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  Bell,
  ClipboardList,
  CreditCard,
  FileDown,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Users,
  UserCog,
  Wallet,
  Wrench,
} from "lucide-react";

export type AdminPermissionCode = string;

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** When set, UI may hide the item after phase 02 wires RBAC. */
  permission?: AdminPermissionCode;
}

export interface AdminNavGroup {
  id: string;
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "core",
    title: "هسته عملیاتی",
    items: [
      {
        title: "داشبورد",
        href: "/admins",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
      {
        title: "کاربران",
        href: "/admins/users",
        icon: Users,
        permission: "users.view",
      },
      {
        title: "خدمات‌دهندگان",
        href: "/admins/providers",
        icon: BadgeCheck,
        permission: "providers.view",
      },
      {
        title: "درخواست‌ها",
        href: "/admins/service-requests",
        icon: ClipboardList,
        permission: "requests.view",
      },
    ],
  },
  {
    id: "catalog",
    title: "کاتالوگ",
    items: [
      {
        title: "دسته‌ها",
        href: "/admins/catalog/categories",
        icon: FolderTree,
        permission: "catalog.view",
      },
      {
        title: "خدمات",
        href: "/admins/catalog/services",
        icon: Package,
        permission: "catalog.view",
      },
      {
        title: "مرتب‌سازی",
        href: "/admins/catalog/reorder",
        icon: ListOrdered,
        permission: "catalog.manage",
      },
    ],
  },
  {
    id: "finance",
    title: "اشتراک و مالی",
    items: [
      {
        title: "پلن‌های اشتراک",
        href: "/admins/subscription-plans",
        icon: Wallet,
        permission: "subscriptions.view",
      },
      {
        title: "اشتراک‌ها",
        href: "/admins/provider-subscriptions",
        icon: Receipt,
        permission: "subscriptions.view",
      },
      {
        title: "پرداخت‌ها",
        href: "/admins/payments",
        icon: CreditCard,
        permission: "payments.view",
      },
      {
        title: "بازپرداخت‌ها",
        href: "/admins/refunds",
        icon: Receipt,
        permission: "payments.view",
      },
    ],
  },
  {
    id: "access",
    title: "دسترسی و امنیت",
    items: [
      {
        title: "مدیران",
        href: "/admins/admins",
        icon: UserCog,
        permission: "admins.view",
      },
      {
        title: "نقش‌ها",
        href: "/admins/roles",
        icon: Shield,
        permission: "roles.view",
      },
      {
        title: "مجوزها",
        href: "/admins/permissions",
        icon: KeyRound,
        permission: "roles.view",
      },
      {
        title: "گزارش ممیزی",
        href: "/admins/audit-logs",
        icon: ScrollText,
        permission: "audit_logs.view",
      },
    ],
  },
  {
    id: "system",
    title: "سیستم",
    items: [
      {
        title: "اعلان‌ها",
        href: "/admins/notifications",
        icon: Bell,
        permission: "notifications.view",
      },
      {
        title: "گزارش کلی",
        href: "/admins/reports/overview",
        icon: Activity,
        permission: "reports.view",
      },
      {
        title: "گزارش مالی",
        href: "/admins/reports/financial",
        icon: Activity,
        permission: "reports.view",
      },
      {
        title: "خروجی‌ها",
        href: "/admins/exports",
        icon: FileDown,
      },
      {
        title: "تنظیمات",
        href: "/admins/settings",
        icon: Settings,
        permission: "settings.view",
      },
      {
        title: "Jobs",
        href: "/admins/jobs",
        icon: Wrench,
      },
      {
        title: "نمایش کامپوننت‌ها",
        href: "/admins/demo",
        icon: LayoutDashboard,
      },
    ],
  },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admins") {
    return pathname === "/admins" || pathname === "/admins/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
