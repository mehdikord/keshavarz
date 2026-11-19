import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  ChartLine,
  ChartPie,
  ClipboardList,
  CreditCard,
  FileDown,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  Package,
  ReceiptText,
  ScrollText,
  Settings,
  Shapes,
  Shield,
  Undo2,
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
  /** Item is shown only when the admin holds this permission. */
  permission?: AdminPermissionCode;
  /** Item is shown when the admin holds at least one of these permissions. */
  anyPermissions?: AdminPermissionCode[];
  /** Developer tooling: hidden from production builds. */
  devOnly?: boolean;
  /** Extra search terms for the command palette. */
  keywords?: string[];
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
        icon: ReceiptText,
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
        icon: Undo2,
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
        icon: ChartPie,
        permission: "reports.view",
      },
      {
        title: "گزارش مالی",
        href: "/admins/reports/financial",
        icon: ChartLine,
        permission: "reports.view",
      },
      {
        title: "خروجی‌ها",
        href: "/admins/exports",
        icon: FileDown,
        anyPermissions: ["payments.export", "reports.export"],
        keywords: ["csv", "export", "دانلود"],
      },
      {
        title: "تنظیمات",
        href: "/admins/settings",
        icon: Settings,
        permission: "settings.view",
      },
      {
        title: "کارهای زمان‌بندی‌شده",
        href: "/admins/jobs",
        icon: Wrench,
        anyPermissions: ["settings.manage", "payments.view", "notifications.view"],
        keywords: ["jobs", "dead letter", "صف"],
      },
      {
        title: "نمایش کامپوننت‌ها",
        href: "/admins/demo",
        icon: Shapes,
        devOnly: true,
      },
    ],
  },
];

/** Pages reachable from the account menu rather than the sidebar. */
export const ADMIN_ACCOUNT_ITEMS: AdminNavItem[] = [
  { title: "پروفایل", href: "/admins/me", icon: UserCog, keywords: ["profile"] },
  {
    title: "تغییر رمز عبور",
    href: "/admins/me/change-password",
    icon: KeyRound,
    keywords: ["password", "رمز"],
  },
  {
    title: "نشست‌های فعال",
    href: "/admins/me/sessions",
    icon: Shield,
    keywords: ["sessions", "دستگاه", "خروج"],
  },
];

export function isAdminNavItemAllowed(
  item: AdminNavItem,
  can: (permission?: string) => boolean,
): boolean {
  if (item.devOnly && process.env.NODE_ENV === "production") return false;
  if (item.permission && !can(item.permission)) return false;
  if (item.anyPermissions && !item.anyPermissions.some((code) => can(code))) {
    return false;
  }
  return true;
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admins") {
    return pathname === "/admins" || pathname === "/admins/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
