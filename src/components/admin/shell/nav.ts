import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  KeyRound,
  Layers3,
  ListChecks,
  Package,
  Receipt,
  ScrollText,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Tractor,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_PERMISSIONS, type AdminPermissionCode } from "@/lib/admin/permissions";

export interface AdminNavItem {
  /** Sub-pages: the item becomes an expandable parent and `href` is only its section prefix. */
  children?: AdminNavItem[];
  href: string;
  icon: LucideIcon;
  keywords?: string;
  label: string;
  permission: AdminPermissionCode;
  /** Section is planned but not built yet. */
  upcoming?: boolean;
}

export interface AdminNavGroup {
  items: AdminNavItem[];
  label: string;
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "نمای کلی",
    items: [
      {
        href: "/admins",
        icon: LayoutDashboard,
        keywords: "داشبورد خانه آمار",
        label: "داشبورد",
        permission: ADMIN_PERMISSIONS.dashboardView,
      },
    ],
  },
  {
    label: "مردم",
    items: [
      {
        href: "/admins/users",
        icon: Users,
        keywords: "کاربران کشاورز مشتری حساب",
        label: "کاربران",
        permission: ADMIN_PERMISSIONS.usersView,
      },
      {
        href: "/admins/providers",
        icon: Tractor,
        keywords: "خدمات دهنده ارائه دهنده محدوده موقعیت پیمانکار",
        label: "خدمات‌دهندگان",
        permission: ADMIN_PERMISSIONS.providersView,
      },
    ],
  },
  {
    label: "عملیات",
    items: [
      {
        href: "/admins/requests",
        icon: ClipboardList,
        keywords: "درخواست سفارش لغو کار",
        label: "درخواست‌های خدمت",
        permission: ADMIN_PERMISSIONS.requestsView,
      },
      {
        children: [
          {
            href: "/admins/catalog/categories",
            icon: FolderTree,
            keywords: "دسته بندی گروه کاتالوگ خدمات",
            label: "دسته‌بندی خدمات",
            permission: ADMIN_PERMISSIONS.catalogView,
          },
          {
            href: "/admins/catalog/services",
            icon: ListChecks,
            keywords: "خدمت خدمات کاتالوگ کاشت برداشت سمپاشی تصویر",
            label: "لیست خدمات",
            permission: ADMIN_PERMISSIONS.catalogView,
          },
        ],
        href: "/admins/catalog",
        icon: Layers3,
        label: "مدیریت خدمات",
        permission: ADMIN_PERMISSIONS.catalogView,
      },
      {
        children: [
          {
            href: "/admins/billing/subscriptions",
            icon: BadgeCheck,
            keywords: "اشتراک خدمات دهنده تمدید اعطا",
            label: "اشتراک‌ها",
            permission: ADMIN_PERMISSIONS.subscriptionsView,
          },
          {
            href: "/admins/billing/plans",
            icon: Package,
            keywords: "پلن طرح اشتراک قیمت",
            label: "پلن‌های اشتراک",
            permission: ADMIN_PERMISSIONS.subscriptionsView,
          },
          {
            href: "/admins/billing/payments",
            icon: Receipt,
            keywords: "پرداخت تراکنش بازپرداخت استرداد",
            label: "پرداخت‌ها",
            permission: ADMIN_PERMISSIONS.paymentsView,
          },
        ],
        href: "/admins/billing",
        icon: CreditCard,
        label: "اشتراک و پرداخت",
        permission: ADMIN_PERMISSIONS.subscriptionsView,
      },
      {
        href: "/admins/notifications",
        icon: Bell,
        keywords: "اعلان پیام ارسال پیامک اطلاع رسانی",
        label: "اعلان‌ها",
        permission: ADMIN_PERMISSIONS.notificationsView,
      },
      {
        href: "/admins/reports",
        icon: BarChart3,
        keywords: "گزارش آمار نمودار درآمد خروجی",
        label: "گزارش‌ها",
        permission: ADMIN_PERMISSIONS.reportsView,
      },
    ],
  },
  {
    label: "سامانه",
    items: [
      {
        children: [
          {
            href: "/admins/team/admins",
            icon: UserCog,
            keywords: "مدیر ادمین کاربر پنل",
            label: "مدیران",
            permission: ADMIN_PERMISSIONS.adminsView,
          },
          {
            href: "/admins/team/roles",
            icon: KeyRound,
            keywords: "نقش دسترسی مجوز سطح",
            label: "نقش‌ها و دسترسی‌ها",
            permission: ADMIN_PERMISSIONS.rolesView,
          },
          {
            href: "/admins/team/audit",
            icon: ScrollText,
            keywords: "ممیزی لاگ تاریخچه فعالیت مدیران",
            label: "گزارش ممیزی",
            permission: ADMIN_PERMISSIONS.auditLogsView,
          },
        ],
        href: "/admins/team",
        icon: ShieldCheck,
        label: "مدیران و دسترسی‌ها",
        permission: ADMIN_PERMISSIONS.adminsView,
      },
      {
        children: [
          {
            href: "/admins/settings/general",
            icon: SlidersHorizontal,
            keywords: "تنظیمات عمومی پشتیبانی پیکربندی",
            label: "تنظیمات عمومی",
            permission: ADMIN_PERMISSIONS.settingsView,
          },
          {
            href: "/admins/settings/system",
            icon: Activity,
            keywords: "وضعیت سامانه زمان بندی کار پس زمینه صف",
            label: "وضعیت سامانه",
            permission: ADMIN_PERMISSIONS.settingsView,
          },
        ],
        href: "/admins/settings",
        icon: Settings2,
        label: "تنظیمات",
        permission: ADMIN_PERMISSIONS.settingsView,
      },
    ],
  },
];

/** Leaf pages, for search: parents are replaced by their children. */
export function flattenNav(items: AdminNavItem[]): AdminNavItem[] {
  return items.flatMap((item) =>
    item.children?.length
      ? item.children.map((child) => ({ ...child, keywords: `${item.label} ${child.keywords ?? ""}` }))
      : [item],
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admins") return pathname === "/admins";
  return pathname === href || pathname.startsWith(`${href}/`);
}
